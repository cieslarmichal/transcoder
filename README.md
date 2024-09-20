# Video transcoder service

## Architecture

```mermaid
flowchart TB
  API[API Service]:::service
  DOWNLOADER[Downloader Service]:::service
  ENCODING_DIRECTOR[Encoding Director Service]:::service
  ENCODER[Encoder Service]:::service
  UPLOADER[Uploader Service]:::service
  PLAYLIST_STICHER[Playlist Sticher Service]:::service

  USERS[Users]:::external
  RABBITMQ[RabbitMQ]:::external
  S3[S3 Storage]:::external

  REDIS[Redis]:::db

  USERS -->|send video| API
  USERS -->|get progress| API
  USERS -->|get artifacts| API
  API -->|video upload| S3
  API -->|done| RABBITMQ
  API -->|get progress| REDIS

  RABBITMQ -->|url to download| DOWNLOADER
  DOWNLOADER -->|video download| S3
  DOWNLOADER -->|done| RABBITMQ

  RABBITMQ -->|video id| ENCODING_DIRECTOR
  ENCODING_DIRECTOR -->|video encoding spec| RABBITMQ

  RABBITMQ -->|video path with encoding spec| ENCODER
  ENCODER -->|save progress| REDIS
  ENCODER -->|done| RABBITMQ

  RABBITMQ -->|encoded file path| UPLOADER
  UPLOADER -->|file upload| S3
  UPLOADER -->|done| RABBITMQ

  RABBITMQ -->|encoding id| PLAYLIST_STICHER
  PLAYLIST_STICHER -->|master playlist upload| S3

  classDef db color:#fff,fill:#ff9655,stroke:#ffa764,stroke-width:2px;
  classDef external color:#fff,fill:#9b84d0,stroke:#9676d7,stroke-width:2px;
  classDef service color:#fff,fill:#3b5dae,stroke:#97a9d3,stroke-width:2px;
```

## RabbitMQ Architecture

```mermaid
flowchart LR
  API[API Service]:::service
  DOWNLOADER[Downloader Service]:::service
  ENCODING_DIRECTOR[Encoding Director Service]:::service
  ENCODER[Encoder Service]:::service
  UPLOADER[Uploader Service]:::service
  PLAYLIST_STICHER[Playlist Sticher Service]:::service

  INGESTED_VIDEOS[ingested-videos queue]:::queue
  DOWNLOADED_VIDEOS[downloaded-videos queue]:::queue
  ENCODING_REQUESTS[encoding-requests queue]:::queue
  ENCODED_VIDEOS[encoded-videos queue]:::queue
  UPLOADED_ARTIFACTS[uploaded-artifacts queue]:::queue

  EXCHANGE[transcoder exchange]:::exchange

  API -->|video.ingested| EXCHANGE
  EXCHANGE --> INGESTED_VIDEOS
  INGESTED_VIDEOS --> DOWNLOADER

  DOWNLOADER -->|video.downloaded| EXCHANGE
  EXCHANGE --> DOWNLOADED_VIDEOS
  DOWNLOADED_VIDEOS --> ENCODING_DIRECTOR

  ENCODING_DIRECTOR -->|video.encoding.requested| EXCHANGE
  EXCHANGE --> ENCODING_REQUESTS
  ENCODING_REQUESTS --> ENCODER
  
  ENCODER -->|video.encoded| EXCHANGE
  EXCHANGE --> ENCODED_VIDEOS
  ENCODED_VIDEOS --> UPLOADER

  UPLOADER -->|video.artifact.uploaded| EXCHANGE
  EXCHANGE --> UPLOADED_ARTIFACTS
  UPLOADED_ARTIFACTS --> PLAYLIST_STICHER

  classDef queue color:#fff,fill:#ff9655,stroke:#ffa764,stroke-width:2px;
  classDef exchange color:#fff,fill:#9b84d0,stroke:#9676d7,stroke-width:2px;
  classDef service color:#fff,fill:#3b5dae,stroke:#97a9d3,stroke-width:2px;
```

## Services

### API Service

- Accepts a video from a user by HTTP
- Uploads a video to S3
- Sends a message with video id and download to RabbitMQ
- Checks the encoding progress in Redis
- Checks the encoding artifacts in S3

### Downloader Service

- Consumes messages with video URL to download from RabbitMQ
- Downloads a video from S3 and saves it to the shared volume
- Sends a downloading done message to RabbitMQ

### Encoding Director Service

- Consumes messages with video id from RabbitMQ
- Decides the encoding profile for the video
- Sends encoding request messages to RabbitMQ (one for each encoding profile)

### Encoder Service

- Consumes messages with encoding format and video path from RabbitMQ
- Encodes a video to the desired format
- Saves the encoding progress to Redis
- Sends an encoding done message to RabbitMQ

### Uploader Service

- Consumes messages about downloading done from RabbitMQ
- Uploads encoding artifacts from shared volume to S3
- Sends an uploading done message to RabbitMQ

### Playlist Sticher Service

- Consumes messages with encoding id from RabbitMQ
- Creates a master playlist for the encoded videos
- Uploads the master playlist to S3
