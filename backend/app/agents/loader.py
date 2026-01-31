import sys
import os
import importlib
from typing import Dict, Any

# Ensure legacy_src is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
legacy_src_path = os.path.abspath(os.path.join(current_dir, "..", "..", "..", "legacy_src"))
if legacy_src_path not in sys.path:
    sys.path.insert(0, legacy_src_path)

class AgentLoader:
    _agents: Dict[str, Any] = {}

    @classmethod
    def load_agents(cls):
        """
        Dynamically load legacy agents.
        This allows 'legacy_src' code to remain untouched while being used here.
        """
        if cls._agents:
            return cls._agents

        print("🔄 Loading Legacy Agents...")
        try:
            # Import Issue Extraction Agent
            import issue_extraction.agent
            cls._agents["issue_extraction"] = issue_extraction.agent.root_agent

            # Import Sentiment Agent
            import sentiment.sentiment_agent
            cls._agents["sentiment"] = sentiment.sentiment_agent.sentiment_analysis_agent

            # Import Service Classification Agent
            import service_classification_agent.agent
            cls._agents["classification"] = service_classification_agent.agent.service_classification_agent
            
            # Import Insight Agent (Try/Except block in case of naming mismatch)
            try:
                import insight_and_report_agent.agent
                # Inspect module to find agent if name isn't standard
                if hasattr(insight_and_report_agent.agent, 'insight_report_agent'):
                     cls._agents["insights"] = insight_and_report_agent.agent.insight_report_agent
                elif hasattr(insight_and_report_agent.agent, 'agent'): # Fallback
                     cls._agents["insights"] = insight_and_report_agent.agent.agent
            except Exception as e:
                print(f"⚠️ Could not load Insight Agent: {e}")

            print(f"✅ Loaded {len(cls._agents)} agents.")
            
        except Exception as e:
            print(f"❌ Error loading agents: {e}")
            # Do not crash app, just log error
        
        return cls._agents

    @classmethod
    def get_agent(cls, name: str):
        if not cls._agents:
            cls.load_agents()
        return cls._agents.get(name)

agent_loader = AgentLoader()
