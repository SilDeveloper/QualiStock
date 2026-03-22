import threading
import webview
from app import app

def iniciar_flask():
    app.run()

if __name__ == "__main__":
    
    t = threading.Thread(target=iniciar_flask)
    t.daemon = True
    t.start()

    webview.create_window(
        "QualiStock",
        "http://127.0.0.1:5000",
        width=1200,
        height=800
    )

    webview.start()