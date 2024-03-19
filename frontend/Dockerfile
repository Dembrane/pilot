FROM node:18-alpine AS builder

RUN npm install -g --force yarn

WORKDIR /code

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_DASHBOARD_BASE_URL
ARG VITE_USE_PARTICIPANT_ROUTER=0

ENV VITE_API_URL=$VITE_API_BASE_URL
ENV VITE_DASHBOARD_BASE_URL=$VITE_DASHBOARD_BASE_URL
ENV VITE_USE_PARTICIPANT_ROUTER=$VITE_USE_PARTICIPANT_ROUTER

RUN yarn build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g --force serve

COPY --from=builder /code/dist /app

CMD ["serve", "-p", "5173", "--single"]