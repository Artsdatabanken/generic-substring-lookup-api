#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push artsdatabanken/generic-substring-lookup-api

echo "Deploying new docker image to test..."
if [ "${BRANCH}" == "master" ]
 then
  sshpass -p $scp_pass scp -v -o StrictHostKeyChecking=no $FILENAME $scp_user@$scp_dest/forvaltningsportal.tar.gz
  curl -X POST -H 'Content-type: application/json' --data '{"text":"deploy generic-substring-lookup-api"}' $slackaddy
fi
