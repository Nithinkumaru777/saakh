FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @saakh/web...
COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm --filter @saakh/web build

FROM node:22-alpine
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo ./
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@saakh/web", "exec", "next", "start", "--port", "3000"]
