# API Documentation

Complete API reference for AgenticSDLC Backend.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is required. Authentication will be added in future versions.

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-05-31T00:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3001/health
```

---

### Workflows

#### GET /api/workflows

Get all workflows (summary view).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Workflow",
      "status": "active",
      "node_count": "3",
      "edge_count": "2",
      "created_at": "2024-05-31T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/workflows
```

---

#### GET /api/workflows/:id

Get a specific workflow with all nodes and edges.

**Parameters:**
- `id` (path) - Workflow UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Workflow",
    "status": "active",
    "created_at": "2024-05-31T00:00:00.000Z",
    "nodes": [
      {
        "id": "node-1",
        "type": "product-vision",
        "label": "Product Vision",
        "category": "Planning",
        "x": 100,
        "y": 100,
        "color": "#3b82f6"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "fromId": "node-1",
        "toId": "node-2",
        "relationship": "successor"
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3001/api/workflows/abc-123-def
```

---

#### POST /api/workflows

Create a new workflow.

**Request Body:**
```json
{
  "name": "My New Workflow",
  "status": "active",
  "nodes": [
    {
      "id": "node-1",
      "type": "product-vision",
      "label": "Product Vision",
      "category": "Planning",
      "x": 100,
      "y": 100,
      "color": "#3b82f6"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromId": "node-1",
      "toId": "node-2",
      "relationship": "successor"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow created successfully",
  "workflowId": "new-uuid-here"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "status": "active",
    "nodes": [],
    "edges": []
  }'
```

---

#### PUT /api/workflows/:id

Update an existing workflow.

**Parameters:**
- `id` (path) - Workflow UUID

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "status": "paused",
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow updated successfully"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3001/api/workflows/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "status": "active",
    "nodes": [],
    "edges": []
  }'
```

---

#### DELETE /api/workflows/:id

Delete a workflow and all its nodes and edges.

**Parameters:**
- `id` (path) - Workflow UUID

**Response:**
```json
{
  "success": true,
  "message": "Workflow deleted successfully"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3001/api/workflows/abc-123
```

---

## Data Models

### Workflow

```typescript
{
  id: string;           // UUID
  name: string;         // Workflow name
  status: string;       // "active" | "paused" | "draft"
  created_at: string;   // ISO 8601 timestamp
  updated_at: string;   // ISO 8601 timestamp
  nodes: Node[];        // Array of nodes
  edges: Edge[];        // Array of edges
}
```

### Node

```typescript
{
  id: string;           // Node ID (e.g., "node-1")
  type: string;         // Node type (e.g., "product-vision")
  label: string;        // Display label
  category: string;     // Category (e.g., "Planning")
  x: number;            // X position on canvas
  y: number;            // Y position on canvas
  color: string;        // Hex color (e.g., "#3b82f6")
}
```

### Edge

```typescript
{
  id: string;           // Edge ID (e.g., "edge-1")
  fromId: string;       // Source node ID
  toId: string;         // Target node ID
  relationship: string; // Relationship type (e.g., "successor")
}
```

### Relationship Types

- `successor` - Sequential flow
- `predecessor` - Reverse flow
- `triggers` - Activation relationship
- `blocks` - Blocking relationship
- `validates` - Validation relationship
- `generates` - Generation relationship
- `depends-on` - Dependency relationship
- `reviewed-by` - Review relationship

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions.

---

## Examples

### Complete Workflow Creation Flow

```bash
# 1. Create a workflow
WORKFLOW_ID=$(curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-commerce Product Launch",
    "status": "active",
    "nodes": [
      {
        "id": "node-1",
        "type": "product-vision",
        "label": "Product Vision",
        "category": "Planning",
        "x": 100,
        "y": 100,
        "color": "#3b82f6"
      },
      {
        "id": "node-2",
        "type": "requirements",
        "label": "Requirements",
        "category": "Planning",
        "x": 300,
        "y": 100,
        "color": "#3b82f6"
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "fromId": "node-1",
        "toId": "node-2",
        "relationship": "successor"
      }
    ]
  }' | jq -r '.workflowId')

# 2. Retrieve the workflow
curl http://localhost:3001/api/workflows/$WORKFLOW_ID | jq

# 3. Update the workflow
curl -X PUT http://localhost:3001/api/workflows/$WORKFLOW_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-commerce Product Launch v2",
    "status": "active",
    "nodes": [...],
    "edges": [...]
  }' | jq

# 4. Delete the workflow
curl -X DELETE http://localhost:3001/api/workflows/$WORKFLOW_ID | jq
```

---

## Testing

Use the provided examples with `curl` or use tools like:

- **Postman** - GUI for API testing
- **Insomnia** - REST client
- **HTTPie** - Command-line HTTP client

---

## Support

For issues or questions, please refer to the main [README.md](README.md).
