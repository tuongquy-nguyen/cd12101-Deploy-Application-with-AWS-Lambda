import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../utils/logger.mjs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// implement dataLayer
const logger = createLogger('TodoAccess')
const url_expiration = process.env.SIGNED_URL_EXPIRATION

export class TodosAccess {
  constructor(
    dynamoDb = DynamoDBDocument.from(new DynamoDB()),
    todosTable = process.env.TODOS_TABLE,
    todosIndex = process.env.TODOS_CREATED_AT_INDEX,
    S3 = new S3Client(),
    s3_bucket_name = process.env.ATTACHMENT_S3_BUCKET
  ) {
    this.dynamoDb = dynamoDb
    this.S3 = S3
    this.todosTable = todosTable
    this.todosIndex = todosIndex
    this.bucket_name = s3_bucket_name
  }

  // Create
  async createTodo(todo) {
    logger.info('Call function createTodo')

    try {
      await this.dynamoDb.put({
        TableName: this.todosTable,
        Item: todo
      })

      return todo
    } catch (e) {
      return 'Create Error: ' + e.message
    }
  }

  // update Todo
  async updateTodo(userId, todoId, updateToDoRequest) {
    logger.info('Call function updateTodo')

    try {
      await this.dynamoDb.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression:
          'set #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#dueDate': 'dueDate',
          '#done': 'done'
        },
        ExpressionAttributeValues: {
          ':name': updateToDoRequest.name,
          ':dueDate': updateToDoRequest.dueDate,
          ':done': updateToDoRequest.done
        },
        ReturnValues: 'UPDATED_NEW'
      })

      return 'Update'
    } catch (e) {
      return 'Update' + e.message
    }
  }

  // Update URL
  async updateAttachmentPresignedUrl(userId, todoId) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket_name,
        Key: todoId
      })

      const url = await getSignedUrl(this.S3, command, {
        expiresIn: parseInt(url_expiration)
      })

      await this.dynamoDb.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :URL',
        ExpressionAttributeValues: {
          ':URL': url.split('?')[0]
        },
        ReturnValues: 'UPDATED_NEW'
      })

      return url
    } catch (e) {
      return 'Error' + e.message
    }
  }

  // Delete
  async deteteTodo(userId, todoId) {
    try {
      await this.dynamoDb.delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      })

      return 'Delete'
    } catch (e) {
      return 'Delete' + e.message
    }
  }

  // Get all todo
  async getAll(userId) {
    logger.info('Call function getAll')

    const result = await this.dynamoDb.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })

    return result.Items
  }
}
