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

  USERS -->|1. Sends a file by HTTP| API
  API -->|2. Uploads a file| S3
  API -->|3. Sends source file ready message| RABBITMQ

  RABBITMQ -->|4. Fetches a file URL to download| DOWNLOADER
  DOWNLOADER -->|5. Downloads a file| S3
  DOWNLOADER -->|6. Sends downloading done message| RABBITMQ

  RABBITMQ -->|7. Fetches downloading done message| ENCODER
  ENCODER -->|8. Saves encoding progress| REDIS
  ENCODER -->|9. Sends encoding done message| RABBITMQ

  RABBITMQ -->|10. Fetches encoding done message| UPLOADER
  UPLOADER -->|11. Sends uploading done message| RABBITMQ

  RABBITMQ -->|12. Fetches uploading done message| NOTIFIER
  NOTIFIER -->|13. Sends an email to the user| EMAIL_PROVIDER

  classDef db,external,service color:#fff
  classDef db fill:#ff9655,stroke:#ffa764
  classDef external fill:#9b84d0,stroke:#9676d7
  classDef service fill:#3b5dae,stroke:#97a9d3
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
