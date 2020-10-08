#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push artsdatabanken/generic-substring-lookup-api

echo "Deploying new docker image to test..."
echo "Branch is:"
echo "$BRANCH"
echo "${BRANCH}"
if [ "${BRANCH}" == "master" ]
 then
  curl -X POST -H 'Content-type: application/json' --data '{"text":"deploy generic-substring-lookup-api"}' $slackaddy
fi
