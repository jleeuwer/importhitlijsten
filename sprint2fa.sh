npm install
export DATABASE_URL="postgres://postgres:Honda2023@localhost:5433/musicdb"
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2f-a
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2f-a
# npm run db:migrate:sprint2f-a
npm run test:sprint2f-a
npm run test:validation:2d-a

