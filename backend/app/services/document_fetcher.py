from __future__ import annotations

import re
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0 and data.strip():
            self.parts.append(data.strip())

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def fetch_document_text(url: str, timeout_seconds: int = 20) -> str:
    def parse_text(raw_bytes, content_type) -> str:
        text = raw_bytes.decode("utf-8", errors="replace")
        if "html" in content_type.lower() or "<html" in text[:500].lower():
            parser = TextExtractor()
            parser.feed(text)
            return parser.text()
        return re.sub(r"\s+", " ", text).strip()

    # Strategy 1: Jina Reader API (handles JS rendering and anti-bot)
    jina_url = f"https://r.jina.ai/{url}"
    try:
        request = Request(
            jina_url,
            headers={
                "User-Agent": "TrendMapDocumentExtractor/1.0",
                "Accept": "text/html,text/plain,application/xhtml+xml",
            },
        )
        with urlopen(request, timeout=timeout_seconds) as response:
            raw = response.read(1_000_000)
            content_type = response.headers.get("content-type", "")
            text = parse_text(raw, content_type)
            if len(text.split()) >= 40:
                return text[:12000]
    except Exception as exc:
        print(f"Jina fetch failed for {url}: {exc}")

    # Strategy 2: Direct Fetch (Fallback)
    try:
        request = Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,text/plain,application/xhtml+xml",
            },
        )
        with urlopen(request, timeout=timeout_seconds) as response:
            raw = response.read(1_000_000)
            content_type = response.headers.get("content-type", "")
            text = parse_text(raw, content_type)
    except Exception as exc:
        raise RuntimeError(f"Unable to fetch {url}: {exc}") from exc

    if len(text.split()) < 40:
        raise RuntimeError(f"Fetched content from {url} was too short to review")

    return text[:12000]
