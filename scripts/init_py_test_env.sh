echo "Creating virtual environment..."
docker-compose exec django pipenv run pipenv install -d

echo "Ensuring databases are available..."
docker-compose exec django pipenv run createdb test_hsreplaynet -Upostgres
docker-compose exec django pipenv run createdb test_uploads -Upostgres

echo "Applying migrations..."
docker-compose exec django pipenv run python manage.py migrate --settings tests.settings

echo "Loading card data..."
docker-compose exec django pipenv run python manage.py load_cards --settings tests.settings

echo "Complete."
