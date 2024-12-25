import base64
import boto3
from io import BytesIO
import os
import json
from rembg import remove
from PIL import Image


def handler(event, context):
    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')

    # Loops through every file uploaded
    for record in event['Records']:
        receipt_handle = record["receiptHandle"]
        body = json.loads(record["body"])

        token = body["token"]
        print(f"Processing message: {token}")

        data = s3.get_object(
            Bucket=os.environ["WOW_EMOJI_DATA_S3_BUCKET"], Key=f"{token}-input")

        print("Removing background")

        # Remove background
        input = Image.open(BytesIO(data["Body"].read()))
        output = remove(input)

        # Save to S3
        s3.upload_fileobj(Bucket=os.environ["WOW_EMOJI_DATA_S3_BUCKET"],
                          Key=f"{token}-input-rembg", Fileobj=BytesIO(output))

        # Add new message to next SQS queue
        sqs.send_message(QueueUrl=os.environ["WOW_EMOJI_COMBINER_INPUT_QUEUE"],
                         MessageBody=record["body"])

        # Remove original message from SQS queue
        sqs.delete_message(QueueUrl=os.environ["WOW_EMOJI_REMBG_INPUT_QUEUE"],
                           ReceiptHandle=receipt_handle)
