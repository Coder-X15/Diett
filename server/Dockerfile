FROM golang:1.22.6-alpine3.20 as dev

WORKDIR /app

COPY . .

RUN addgroup -S golang && adduser -S golang -G golang

RUN chown -R golang:golang /app

USER golang

RUN go mod tidy

RUN go build -o apiserver

EXPOSE 8080

CMD ["./apiserver"]