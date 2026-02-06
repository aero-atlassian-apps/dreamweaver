/**
 * MCPTransport - Abstraction for Model Context Protocol communication.
 * 
 * Allows switching between transport layers (Stdio, WebSocket, Loopback)
 * without changing the adapter logic.
 */
export interface JsonRpcRequest {
    jsonrpc: '2.0'
    method: string
    params?: unknown
    id: string | number
}

export interface JsonRpcResponse {
    jsonrpc: '2.0'
    result?: unknown
    error?: {
        code: number
        message: string
        data?: unknown
    }
    id: string | number
}

export interface MCPTransport {
    /**
     * Sends a JSON-RPC request and returns the response.
     */
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>

    /**
     * Connects to the transport (if applicable).
     */
    connect(): Promise<void>

    /**
     * Closes the connection.
     */
    close(): Promise<void>
}
