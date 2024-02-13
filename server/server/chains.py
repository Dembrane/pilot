from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

def load_title_chain():
    prompt = ChatPromptTemplate.from_template("Generate a title for the given text. Do not enclose the title in quotes. Only output the title.\nText:{text}\nTitle:")
    model = ChatOpenAI(temperature=0.5, model_name="gpt-3.5-turbo-1106", max_retries=6)
    return prompt | model | StrOutputParser()
