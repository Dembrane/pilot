"""Prompt template rendering module.

This module provides functionality for loading and rendering Jinja2 templates
from a configured templates directory. Templates are automatically loaded from
PROMPT_TEMPLATES_DIR and must have the .jinja extension.

Example:
    >>> render_prompt("context-1.jinja", {"model": "gpt-4"})
    "You are a helpful AI assistant powered by gpt-4..."

Attributes:
    env (Environment): Jinja2 environment configured with the template directory
    PROMPT_TEMPLATE_LIST (list[str]): List of available template filenames
"""

import os
import logging
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from dembrane.config import PROMPT_TEMPLATES_DIR

logger = logging.getLogger("prompts")

env = Environment(
    loader=FileSystemLoader(PROMPT_TEMPLATES_DIR),
    autoescape=select_autoescape()
)

# Load all the files from PROMPT_TEMPLATES_DIR that end with .jinja
PROMPT_TEMPLATE_LIST = [f.name for f in os.scandir(PROMPT_TEMPLATES_DIR) if f.is_file() and f.name.endswith(".jinja")]

logger.info(f"Loaded {len(PROMPT_TEMPLATE_LIST)} prompt templates: {', '.join(PROMPT_TEMPLATE_LIST)}")


def render_prompt(prompt_name: str, kwargs: dict[str, Any]) -> str:
    """Render a prompt template with the given arguments.

    Args:
        prompt_name: Name of the prompt template file (must end in .jinja)
        kwargs: Dictionary of arguments to pass to the template renderer

    Returns:
        The rendered prompt template as a string

    Raises:
        ValueError: If the prompt template is not found in PROMPT_TEMPLATES_DIR
    """
    logger.debug(f"Rendering prompt {prompt_name} with kwargs: {kwargs.keys()}")
    if prompt_name not in PROMPT_TEMPLATE_LIST:
        raise ValueError(f"Prompt template {prompt_name} not found")

    template = env.get_template(prompt_name)
    return template.render(**kwargs)
