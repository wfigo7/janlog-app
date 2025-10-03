"""
Lambda Web Adapter エントリーポイント
LWA用のダミーハンドラー（使用されないが定義が必要）
"""

def handler(event, context):
    """
    LWAが使用されるため、このハンドラーは実際には呼ばれない
    """
    return {
        'statusCode': 200,
        'body': 'This handler should not be called when using LWA'
    }