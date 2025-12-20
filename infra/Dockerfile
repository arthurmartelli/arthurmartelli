FROM debian:stable-slim AS base

ARG APP_USER_ID="65534"
ARG APP_GROUP_ID="65534"

SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

ENV HOME="/opt" \
  TZ="UTC" \
  SHELL="/bin/bash"
ENV APP_BASE_PATH="$HOME/app" \
  APP_USER="${APP_USER_ID}" \
  APP_GROUP="${APP_GROUP_ID}" \
  APP_PORT="4321" \
  APP_HOST="0.0.0.0"

RUN getent group ${APP_GROUP_ID} || groupmod -g ${APP_GROUP_ID} nogroup; \
  getent passwd ${APP_USER_ID} || usermod -u ${APP_USER_ID} -g ${APP_GROUP_ID} nobody;

# replicate cloudflare v3 environment https://developers.cloudflare.com/pages/configuration/build-image
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl nodejs npm && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir -p "$APP_BASE_PATH" && \
  chown -R ${APP_USER_ID}:${APP_GROUP_ID} "$HOME"

WORKDIR "${APP_BASE_PATH}"
USER "${APP_USER_ID}:${APP_GROUP_ID}"
EXPOSE ${APP_PORT}
VOLUME [ "${APP_BASE_PATH}" ]
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD curl -fsSL --user-agent docker-probe http://${APP_HOST}:${APP_PORT} || exit 1

FROM base AS development
ENV NODE_ENV="development"
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV="production"
COPY --chown=${APP_USER_ID}:${APP_GROUP_ID} . .
RUN npm ci --production
ENTRYPOINT ["npm"]
CMD ["run", "prod"]
