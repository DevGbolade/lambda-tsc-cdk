import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CrudLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for CRUD operations
    const crudLambda = new lambda.Function(this, 'CrudLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant Lambda permissions to interact with the DynamoDB table
    table.grantReadWriteData(crudLambda);

    // API Gateway to expose Lambda via HTTP
    const api = new apigateway.RestApi(this, 'crud-api', {
      restApiName: 'CRUD Service',
      description: 'This service serves CRUD operations.',
    });

    // Define CRUD routes
    const items = api.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(crudLambda));
    items.addMethod('POST', new apigateway.LambdaIntegration(crudLambda));

    const singleItem = items.addResource('{id}');
    singleItem.addMethod('GET', new apigateway.LambdaIntegration(crudLambda));
    singleItem.addMethod('PUT', new apigateway.LambdaIntegration(crudLambda));
    singleItem.addMethod('DELETE', new apigateway.LambdaIntegration(crudLambda));
  }
}
