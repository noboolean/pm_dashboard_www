# Custom Pironman 5 image for Umbrel: stock SunFounder base + fixed dashboard + custom OLED pages
FROM node:20-bookworm-slim AS www
WORKDIR /src
COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY public ./public
COPY src ./src
RUN CI=false npm run build

FROM sunfounder/pironman5:base-1.3.11
ARG SITE=/opt/pironman5/venv/lib/python3.12/site-packages
RUN rm -rf ${SITE}/pm_dashboard/www
COPY --from=www /src/build ${SITE}/pm_dashboard/www
COPY umbrel/oled-pages/ ${SITE}/pm_auto/addons/oled/pages/
