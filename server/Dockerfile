FROM golang:1.26.0

WORKDIR /app

COPY . .

RUN go mod tidy

RUN go build -o apiserver

EXPOSE 8080

CMD ["./apiserver"]