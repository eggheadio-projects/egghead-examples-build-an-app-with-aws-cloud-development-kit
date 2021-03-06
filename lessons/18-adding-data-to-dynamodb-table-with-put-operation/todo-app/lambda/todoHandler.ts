/// <reference types="aws-sdk" />
import AWS = require("aws-sdk");

const tableName = process.env.TABLE_NAME || "";
const dynamo = new AWS.DynamoDB.DocumentClient();

const createResponse = (
    body: string | AWS.DynamoDB.DocumentClient.ItemList,
    statusCode = 200
) => {
    return {
        statusCode,
        body: JSON.stringify(body, null, 2)
    };
};

const getAllTodos = async () => {
    const scanResult = await dynamo
        .scan({
            TableName: tableName
        })
        .promise();

    return scanResult;
};

const addTodoItem = async (data: { todo: string; id: string }) => {
    const { id, todo } = data;
    if (todo && todo !== "") {
        await dynamo
            .put({
                TableName: tableName,
                Item: {
                    id: "totally_random_id",
                    todo
                }
            })
            .promise();
    }

    return todo;
};

exports.handler = async function (event: AWSLambda.APIGatewayEvent) {
    try {
        const { httpMethod, body: requestBody } = event;

        if (httpMethod === "GET") {
            const response = await getAllTodos();

            return createResponse(response.Items || []);
        }

        if (!requestBody) {
            return createResponse("Missing request body", 500);
        }

        const data = JSON.parse(requestBody);

        if (httpMethod === "POST") {
            const todo = await addTodoItem(data);
            return todo
                ? createResponse(`${todo} added to the database`)
                : createResponse("Todo is missing", 500);
        }

        return createResponse(
            `We only accept GET, POST, OPTIONS and DELETE, not ${httpMethod}`,
            500
        );
    } catch (error) {
        console.log(error);
        return createResponse(error, 500);
    }
};
