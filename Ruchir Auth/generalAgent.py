import os
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_openai import ChatOpenAI
from composio_langchain import ComposioToolSet, Action, App
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

current_date = datetime.now()
formatted_date = current_date.strftime("%Y,%m,%d,00,00,00")
# print(formatted_date)



llm = ChatOpenAI()
prompt = hub.pull("hwchase17/openai-functions-agent")

composio_toolset = ComposioToolSet(api_key="")
tools = composio_toolset.get_tools(actions=['GOOGLECALENDAR_FIND_EVENT'])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
task = f"give me max_results=5 next events timeMin={formatted_date}"

result = agent_executor.invoke({"input": task} )
print(result)