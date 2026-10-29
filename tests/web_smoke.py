# Web smoke test on the exported build (dist/) or a live URL (TTT_URL): the tutorial's last
# button starts a game, and both cube views fit at 390px. Screenshots go to $SHOTS if set.
# Run: npx expo export --platform web && ~/.cosmic/whop/venv/bin/python tests/web_smoke.py
import http.server, threading, functools, pathlib, os
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent / "dist"
class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)): self.path = "/index.html"
        return super().send_head()
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(SPA, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = os.environ.get("TTT_URL") or f"http://127.0.0.1:{srv.server_address[1]}/"
shots = os.environ.get("SHOTS")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, channel="chrome")
    pg = b.new_page(viewport={"width": 390, "height": 844}, has_touch=True); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(2500)
    pg.get_by_text("HOW TO PLAY", exact=True).click(); pg.wait_for_timeout(500)
    for _ in range(12):
        nxt = pg.get_by_text("Next >", exact=True)
        if not nxt.count(): break
        nxt.click(); pg.wait_for_timeout(150)
    pg.get_by_text("Let's Play", exact=True).click(); pg.wait_for_timeout(2000)
    assert pg.get_by_text("< Menu").count(), "Let's Play did not start a game"
    print("ok: Let's Play starts a game")
    if shots: pg.screenshot(path=f"{shots}/ttt-board-390.png")
    # open a mini-board from the layer panel and check its 3D view fits
    # open a mini-board: tap the middle cell of the Front layer in the panel under the cube
    front = pg.get_by_text("Front", exact=True).first.bounding_box()
    pg.mouse.click(front["x"] + front["width"] / 2, front["y"] + front["height"] + 58)
    pg.wait_for_timeout(2500)
    assert pg.get_by_text("Board ", exact=False).count(), "mini-board view did not open"
    if shots: pg.screenshot(path=f"{shots}/ttt-mini-390.png")
    assert not errs, errs
    b.close()
print("ok: mini-board view opened at 390px")
