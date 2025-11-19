"""
Simple listener for your LiveKit agent.
Add this to your agent.py file to receive messages from the TypeScript sender.

IMPORTANT: This processes ALL data_received events, not just server-sent ones.
"""

@ctx.room.on("data_received")
def on_data_received(data_packet: rtc.DataPacket):
    """Handle all incoming data messages."""
    try:
        # Decode the JSON payload
        payload = json.loads(data_packet.data.decode("utf-8"))
        message = payload.get("message")

        if message:
            logger.info(f"Received external message: {message}")
            session.interrupt()
            session.generate_reply(user_input=f"System: {message}")
    except Exception as e:
        logger.error(f"Error processing data: {e}")
