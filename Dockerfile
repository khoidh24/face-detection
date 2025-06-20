FROM node:18-buster as build-stage
WORKDIR /app
COPY . .
COPY package.json /app/
RUN yarn install
RUN yarn build


FROM node:18-buster as production-stage
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000

COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/package.json ./package.json
COPY --from=build-stage  /app/.next/standalone ./
COPY --from=build-stage  /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
