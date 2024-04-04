class ApiResponse {
  statusCode: number;
  data: any; // Consider defining a more specific type for data
  message: string;
  success: boolean;

  constructor(
    statusCode: number,
    data: any, // Use a specific type if possible
    message: string = "Success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
