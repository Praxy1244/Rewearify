import pytest
import sys
import os
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app, startup_event

# 1. Define the event loop scope
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# 2. Mark the initialization fixture as async with session scope
@pytest.fixture(scope="session", autouse=True)
async def initialize_services():
    """
    This runs ONCE before all tests.
    It manually triggers the startup event to load models/data.
    """
    print("\n⚡ TEST SETUP: Manually triggering startup event...")
    
    # Manually run the startup function
    await startup_event()
    
    yield
    
    print("\n🛑 TEST TEARDOWN: Tests finished.")
