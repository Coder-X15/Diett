#! /bin/bash

# file to simplify commands for the ease of use
alias deploy="docker compose up -d"
alias view-logs="docker compose logs -f"
alias stop-deployment="docker compose down"
alias reset-frontend-image="docker image remove -f dietplanner-diett-frontend:latest"
alias reset-apiserver-image="docker image remove -f dietplanner-diett-apiserver:latest"
alias reset-inference-image="docker image remove -f dietplanner-diett-inference:latest"
alias reset-all-images="reset-frontend-image && reset-apiserver-image && reset-inference-image"
alias cleanup="stop-deployment && reset-all-images"