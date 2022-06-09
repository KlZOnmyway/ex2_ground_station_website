# SECRET_KEY is used for JWT authentication token generation
export SECRET_KEY="SECRET KEY HERE"

# SLACK_TOKEN is used for the Slack API
# which is used to notify users on passover times
export SLACK_TOKEN="SLACK TOKEN HERE"

# POSTGRES_USER and POSTGRES_PASSWORD are credentials for a **production** database
# The development environment uses "postgres" as a default username and password
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="postgres"
