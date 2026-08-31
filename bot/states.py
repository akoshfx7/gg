from aiogram.fsm.state import State, StatesGroup


class AdminStates(StatesGroup):
    waiting_text = State()
    waiting_button_label = State()
    waiting_channel_title = State()
    waiting_channel_url = State()
    waiting_channel_chatid = State()
