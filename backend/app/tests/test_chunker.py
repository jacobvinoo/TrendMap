from app.services.chunker import chunk_text

def test_chunk_text_empty():
    assert chunk_text("") == []

def test_chunk_text_smaller_than_chunk_size():
    text = "Hello world"
    chunks = chunk_text(text, chunk_size=100, overlap=10)
    assert chunks == ["Hello world"]

def test_chunk_text_exact_chunk_size():
    text = "A" * 100
    chunks = chunk_text(text, chunk_size=100, overlap=10)
    assert chunks == ["A" * 100]

def test_chunk_text_with_overlap():
    text = "0123456789"
    chunks = chunk_text(text, chunk_size=6, overlap=2)
    # chunk 1: 0..5 ("012345")
    # next start: 6 - 2 = 4
    # chunk 2: 4..9 ("456789")
    assert chunks == ["012345", "456789"]

def test_chunk_text_multiple_overlaps():
    text = "0123456789"
    chunks = chunk_text(text, chunk_size=4, overlap=1)
    # ch1: 0123 (end=4, start=3)
    # ch2: 3456 (end=7, start=6)
    # ch3: 6789 (end=10, start=9)
    # ch4: 9 (end=13)
    assert chunks == ["0123", "3456", "6789"]
