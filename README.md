# Video transcoder service

## Architecture

```mermaid
flowchart TB
  API[API Service]:::service
  DOWNLOADER[Downloader Service]:::service
  UPLOADER[Uploader Service]:::service
  NOTIFIER[Notifier Service]:::service
  ENCODER[Encoder Service]:::service

  USERS[Users]:::external
  RABBITMQ[RabbitMQ]:::external
  S3[S3 Storage]:::external
  EMAIL_PROVIDER[Email Provider]:::external

  REDIS[Redis]:::db

  USERS -->|video by http| API
  API -->|video upload| S3
  API -->|done| RABBITMQ

  RABBITMQ -->|url to download| DOWNLOADER
  DOWNLOADER -->|video download| S3
  DOWNLOADER -->|done| RABBITMQ

  RABBITMQ -->|url with target format| ENCODER
  ENCODER -->|save progress| REDIS
  ENCODER -->|done| RABBITMQ

  RABBITMQ -->|encoded file path| UPLOADER
  UPLOADER -->|file upload| S3
  UPLOADER -->|done| RABBITMQ

  RABBITMQ -->|email and url| NOTIFIER
  NOTIFIER -->|send email| EMAIL_PROVIDER

  classDef db color:#fff,fill:#ff9655,stroke:#ffa764,stroke-width:2px;
  classDef external color:#fff,fill:#9b84d0,stroke:#9676d7,stroke-width:2px;
  classDef service color:#fff,fill:#3b5dae,stroke:#97a9d3,stroke-width:2px;
```

## RabbitMQ Architecture

```mermaid
flowchart TB
  API[API Service]:::service
  DOWNLOADER[Downloader Service]:::service
  ENCODER[Encoder Service]:::service
  UPLOADER[Uploader Service]:::service
  NOTIFIER[Notifier Service]:::service

  INGESTED_VIDEOS[Ingested Videos Queue]:::queue
  DOWNLOADED_VIDEOS[Downloaded Videos Queue]:::queue
  ENCODED_VIDEOS[Encoded Videos Queue]:::queue
  UPLOADED_ARTIFACTS[Uploaded Artifacts Queue]:::queue

  EXCHANGE[Transcoder Exchange]:::exchange

  API -->|video.ingested| EXCHANGE
  EXCHANGE --> INGESTED_VIDEOS
  INGESTED_VIDEOS --> DOWNLOADER

  DOWNLOADER -->|video.downloaded| EXCHANGE
  EXCHANGE --> DOWNLOADED_VIDEOS
  DOWNLOADED_VIDEOS --> ENCODER
  
  ENCODER -->|video.encoded| EXCHANGE
  EXCHANGE --> ENCODED_VIDEOS
  ENCODED_VIDEOS --> UPLOADER

  UPLOADER -->|artifact.uploaded| EXCHANGE
  EXCHANGE --> UPLOADED_ARTIFACTS
  UPLOADED_ARTIFACTS --> NOTIFIER

  classDef queue color:#fff,fill:#ff9655,stroke:#ffa764,stroke-width:2px;
  classDef exchange color:#fff,fill:#9b84d0,stroke:#9676d7,stroke-width:2px;
  classDef service color:#fff,fill:#3b5dae,stroke:#97a9d3,stroke-width:2px;
```

## Services

### API Service

- Accepts a file from a user
- Uploads a file to S3
- Sends a message with encoding formats and file URL to RabbitMQ
- Checks the encoding progress in Redis

### Downloader Service

- Consumes messages with file URL to download from RabbitMQ
- Downloads a file from S3 and saves it to the shared volume
- Sends a downloading done message to RabbitMQ

### Encoder Service

- Consumes messages with encoding format and file URL from RabbitMQ
- Encodes a file to the desired format
- Saves the encoding progress to Redis
- Sends an encoding done message to RabbitMQ

### Uploader Service

- Consumes messages about downloading done from RabbitMQ
- Uploads encoded files from shared volume to S3
- Sends an uploading done message to RabbitMQ

### Notifier Service

- Consumes messages about uploading done from RabbitMQ
- Sends an email to the user with a download link
