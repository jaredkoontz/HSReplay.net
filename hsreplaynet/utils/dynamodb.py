from pynamodb.attributes import NumberAttribute


class IntEnumAttribute(NumberAttribute):
	def __init__(self, enum, **kwargs):
		self.enum = enum
		super().__init__(**kwargs)

	def deserialize(self, value):
		value = super().deserialize(value)
		if value is not None:
			try:
				return self.enum(value)
			except ValueError:
				pass
		return value
