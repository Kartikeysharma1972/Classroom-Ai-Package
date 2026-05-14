"""
MCP Tools for ClassroomAI
- get-chat-history: Retrieve last 7 chats
- check-usage-limit: Check daily usage limits
- increment-usage: Increment tool usage
"""

from database import db

def get_chat_history(teacher_id: str) -> dict:
    """Get last 7 chats for a teacher

    Args:
        teacher_id: Unique identifier for the teacher

    Returns:
        Dictionary with list of last 7 chats
    """
    chats = db.get_last_7_chats(teacher_id)

    return {
        "teacher_id": teacher_id,
        "chats": chats,
        "count": len(chats),
        "success": True
    }

def check_usage_limit(teacher_id: str, tool_name: str) -> dict:
    """Check daily usage limit for a tool

    Args:
        teacher_id: Unique identifier for the teacher
        tool_name: Name of the tool (worksheet, lesson_plan, assessment, auto_generate)

    Returns:
        Dictionary with usage info and limit status
    """
    usage = db.get_usage(teacher_id, tool_name)

    return {
        "teacher_id": teacher_id,
        "tool_name": tool_name,
        "usage_count": usage['usage_count'],
        "limit": usage['limit'],
        "remaining": usage['remaining'],
        "exceeded": usage['exceeded'],
        "message": f"{usage['usage_count']}/{usage['limit']} uses today"
    }

def increment_usage(teacher_id: str, tool_name: str) -> dict:
    """Increment usage count for a tool

    Args:
        teacher_id: Unique identifier for the teacher
        tool_name: Name of the tool

    Returns:
        Dictionary with updated usage info
    """
    usage = db.increment_usage(teacher_id, tool_name)

    return {
        "teacher_id": teacher_id,
        "tool_name": tool_name,
        "usage_count": usage['usage_count'],
        "limit": usage['limit'],
        "remaining": usage['remaining'],
        "exceeded": usage['exceeded'],
        "message": f"{usage['usage_count']}/{usage['limit']} uses today",
        "error": "Daily limit exceeded! Try again tomorrow." if usage['exceeded'] else None
    }

# MCP Tool Definitions
TOOLS = {
    "get-chat-history": {
        "description": "Get last 7 chats for a teacher",
        "inputSchema": {
            "type": "object",
            "properties": {
                "teacher_id": {"type": "string", "description": "Teacher's unique identifier"}
            },
            "required": ["teacher_id"]
        }
    },
    "check-usage-limit": {
        "description": "Check daily usage limit for a tool",
        "inputSchema": {
            "type": "object",
            "properties": {
                "teacher_id": {"type": "string", "description": "Teacher's unique identifier"},
                "tool_name": {
                    "type": "string",
                    "description": "Tool name (worksheet, lesson_plan, assessment, auto_generate)"
                }
            },
            "required": ["teacher_id", "tool_name"]
        }
    },
    "increment-usage": {
        "description": "Increment usage count for a tool",
        "inputSchema": {
            "type": "object",
            "properties": {
                "teacher_id": {"type": "string", "description": "Teacher's unique identifier"},
                "tool_name": {"type": "string", "description": "Tool name"}
            },
            "required": ["teacher_id", "tool_name"]
        }
    }
}

def execute_tool(tool_name: str, params: dict) -> dict:
    """Execute an MCP tool"""
    if tool_name == "get-chat-history":
        return get_chat_history(params["teacher_id"])
    elif tool_name == "check-usage-limit":
        return check_usage_limit(params["teacher_id"], params["tool_name"])
    elif tool_name == "increment-usage":
        return increment_usage(params["teacher_id"], params["tool_name"])
    else:
        return {"error": f"Unknown tool: {tool_name}"}
