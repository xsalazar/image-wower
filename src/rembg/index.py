import base64
import boto3
from io import BytesIO
import os
import json
from rembg import remove
from PIL import Image


def handler(event, context):
    s3 = boto3.resource('s3')
    sqs = boto3.resource('sqs')

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
        input = Image.open(BytesIO(base64.b64decode(data.Body)))
        output = remove(input, force_return_bytes=True)

        # Save to S3
        s3.put_object(Bucket=os.environ["WOW_EMOJI_DATA_S3_BUCKET"],
                      Key=f"{token}-input-rembg", Body=output)

        # Add new message to next SQS queue
        sqs.send_message(QueueUrl=os.environ["WOW_EMOJI_COMBINER_INPUT_QUEUE"],
                         MessageBody=record["body"])

        # Remove original message from SQS queue
        sqs.delete_message(QueueUrl=os.environ["WOW_EMOJI_REMBG_INPUT_QUEUE"],
                           ReceiptHandle=receipt_handle)
