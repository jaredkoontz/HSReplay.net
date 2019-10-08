from datetime import datetime
from typing import List, Optional

from django.utils.translation import gettext_lazy as _
from djpaypal.enums import SaleState
from djpaypal.models import BillingAgreement, Payer, Sale
from djstripe.enums import ChargeStatus
from djstripe.models import Card, Charge, Customer, Invoice, Plan, Product, Source
from rest_framework.fields import SerializerMethodField
from rest_framework.serializers import Serializer

from hearthsim.identity.accounts.models import User


class PaymentSerializer(Serializer):
	timestamp = SerializerMethodField()
	method = SerializerMethodField()
	id = SerializerMethodField()
	product = SerializerMethodField()
	total = SerializerMethodField()
	status = SerializerMethodField()
	details_url = SerializerMethodField()


class StripeChargeSerializer(PaymentSerializer):
	def get_timestamp(self, charge: Charge) -> datetime:
		return charge.created

	def get_method(self, charge: Charge) -> str:
		source: Source = charge.source.resolve()
		brand = None
		last4 = None

		if isinstance(source, Source):
			brand = source.source_data.get("brand")
			last4 = source.source_data.get("last4")
		elif isinstance(source, Card):
			brand = source.brand
			last4 = source.last4

		if not brand:
			return str(last4)
		if not last4:
			return str(brand)
		return "{brand} •••• {last4}".format(brand=brand, last4=last4)

	def get_id(self, charge: Charge) -> str:
		invoice = self._get_invoice(charge)
		if invoice:
			return str(invoice.number)
		if charge.receipt_number:
			return str(charge.receipt_number)
		return str(charge.stripe_id)

	def get_product(self, charge: Charge) -> Optional[str]:
		invoice = self._get_invoice(charge)
		if not invoice:
			return None
		plan: Plan = invoice.plan
		if not plan:
			return None
		product: Product = plan.product
		if product:
			return str(product)

	def get_total(self, charge: Charge) -> str:
		return charge.human_readable_amount

	def get_status(self, charge: Charge) -> str:
		if charge.disputed:
			return _("Disputed")
		elif charge.refunded:
			return _("Refunded")
		elif charge.amount_refunded:
			return _("Partially refunded")
		elif charge.status == ChargeStatus.failed:
			return _("Failed")
		elif charge.status == ChargeStatus.pending:
			return _("Pending")
		elif charge.status == ChargeStatus.succeeded:
			return _("Completed")

	def get_details_url(self, charge: Charge) -> Optional[str]:
		invoice = self._get_invoice(charge)
		if invoice:
			return invoice.hosted_invoice_url

	def _get_invoice(self, charge: Charge) -> Optional[Invoice]:
		invoice: Invoice = charge.invoice
		if not invoice:
			try:
				invoice = Invoice.objects.filter(charge_id=charge.djstripe_id).first()
			except Invoice.DoesNotExist:
				pass
		return invoice


class PaypalSaleSerializer(PaymentSerializer):
	def get_timestamp(self, sale: Sale) -> datetime:
		return sale.create_time

	def get_method(self, sale: Sale) -> str:
		billing_agreement: BillingAgreement = sale.billing_agreement
		if billing_agreement:
			payer = billing_agreement.payer
			if "payer_info" in payer and "email" in payer["payer_info"]:
				email = payer["payer_info"]["email"]
				return "PayPal ({email})".format(email=email)

		return "PayPal"

	def get_id(self, sale: Sale):
		return sale.id

	def get_product(self, sale: Sale) -> Optional[str]:
		billing_agreement: BillingAgreement = sale.billing_agreement
		if not billing_agreement:
			return None
		return billing_agreement.name or billing_agreement.description

	def get_total(self, sale: Sale) -> str:
		amount = sale.amount
		total = None
		currency = None
		if amount["total"]:
			total = amount["total"]
		if amount["currency"]:
			currency = amount["currency"]

		if not total:
			return ""

		if currency == "USD":
			return f"${total} {currency}"

		return f"{total} {currency}"

	def get_status(self, sale: Sale) -> str:
		if sale.state == SaleState.completed:
			return _("Completed")
		elif sale.state == SaleState.partially_refunded:
			return _("Partially refunded")
		elif sale.state == SaleState.pending:
			return _("Pending")
		elif sale.state == SaleState.refunded:
			return _("Refunded")
		elif sale.state == SaleState.denied:
			return _("Denied")

	def get_details_url(self, charge: Charge) -> None:
		return None


class UserPaymentSerializer(Serializer):
	payments = SerializerMethodField()

	def get_payments(self, user: User):
		charges = []
		stripe_customer: Customer = user.stripe_customer
		if stripe_customer:
			charges = stripe_customer.charges
		stripe_serializer = StripeChargeSerializer(charges, many=True)

		sales = []
		paypal_payers: Payer = user.paypal_payers
		if paypal_payers:
			payer_ids: List[int] = paypal_payers.values_list("id", flat=True)
			sales = Sale.objects.filter(billing_agreement__payer_model_id__in=payer_ids)
		paypal_serializer = PaypalSaleSerializer(sales, many=True)

		return sorted(
			stripe_serializer.data + paypal_serializer.data,
			key=lambda x: x["timestamp"], reverse=True
		)
