import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {

});

const tableName = process.env.TABLE_NAME || 'resource';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { httpMethod, pathParameters, body } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        if (!pathParameters?.id) {
          return await getAllItems();
        }
        return await getItem(pathParameters!.id);
      case 'POST':
        return await createItem(JSON.parse(body!));
      case 'PUT':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing id for updating' }),
          };
        }
        return await updateItem(pathParameters!.id, JSON.parse(body!));
      case 'DELETE':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing id for deletion' }),
          };
        }
        return await deleteItem(pathParameters!.id);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};

// CRUD operations
const getAllItems = async () => {
  const params = {
    TableName: tableName,
  };
  const result = await dynamoDb.send(new ScanCommand(params));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};

const getItem = async (id: string) => {
  const params = {
    TableName: tableName,
    Key: { id },
  };
  const result = await dynamoDb.send(new GetCommand(params));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
};

const createItem = async (item: any) => {
  const params = {
    TableName: tableName,
    Item: item,
  };
  await dynamoDb.send(new PutCommand(params));
  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Item created' }),
  };
};

const updateItem = async (id: string, item: any) => {
  const params = {
    TableName: tableName,
    Key: { id },
    UpdateExpression: 'set #info = :info',
    ExpressionAttributeNames: { '#info': 'info' },
    ExpressionAttributeValues: {
      ':info': item.info,
    },
  };
  const result = await dynamoDb.send(new UpdateCommand(params));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes),
  };
};

const deleteItem = async (id: string) => {
  const params = {
    TableName: tableName,
    Key: { id },
  };
  await dynamoDb.send(new DeleteCommand(params));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Item deleted' }),
  };
};
