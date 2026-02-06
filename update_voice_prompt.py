import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/telegram_bot')

def get_current_prompt():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT voice_system_prompt 
        FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings 
        WHERE tenant_id = 2
    """)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return result['voice_system_prompt'] if result else None

def update_prompt(new_prompt):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings 
        SET voice_system_prompt = %s 
        WHERE tenant_id = 2
    """, (new_prompt,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("✓ Voice system prompt updated successfully!")

def modify_prompt(original_prompt):
    """Modify the prompt to prioritize direct answers over clarification questions"""
    
    # The key changes:
    # 1. Drastically reduce clarification section
    # 2. Add strong instruction to give direct answers first
    # 3. Only ask when impossible to answer
    
    new_clarification_section = """УТОЧНЕНИЕ (ТОЛЬКО КОГДА НЕВОЗМОЖНО ОТВЕТИТЬ):
- ВСЕГДА давай ПРЯМОЙ ОТВЕТ на основе доступных данных
- Задавай уточняющий вопрос ТОЛЬКО если ответить без дополнительных данных НЕВОЗМОЖНО
- Если пользователь спрашивает "сколько стоит" и есть данные о ценах - СРАЗУ назови цены из доступных периодов"""
    
    # Find and replace the clarification section
    import re
    
    # Pattern to match the УТОЧНЕНИЕ section
    pattern = r'УТОЧНЕНИЕ \(ТОЛЬКО КОГДА НУЖНО\):[\s\S]*?(?=\n[А-ЯЁ][А-ЯЁ\s]+:|$)'
    
    modified_prompt = re.sub(pattern, new_clarification_section, original_prompt)
    
    return modified_prompt

if __name__ == "__main__":
    print("Fetching current prompt...")
    current = get_current_prompt()
    
    if not current:
        print("❌ No prompt found for tenant_id=2")
        exit(1)
    
    print(f"\n{'='*60}")
    print("CURRENT PROMPT:")
    print(f"{'='*60}")
    print(current)
    
    print(f"\n{'='*60}")
    print("MODIFYING PROMPT...")
    print(f"{'='*60}")
    
    modified = modify_prompt(current)
    
    print(f"\n{'='*60}")
    print("NEW PROMPT:")
    print(f"{'='*60}")
    print(modified)
    
    print(f"\n{'='*60}")
    response = input("Apply this update? (yes/no): ")
    
    if response.lower() == 'yes':
        update_prompt(modified)
        print("\n✓ Update completed!")
    else:
        print("\n✗ Update cancelled")
