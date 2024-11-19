from kombu import Queue, Exchange  # type: ignore

enable_utc = True

worker_hijack_root_logger = False

task_queues = (
    Queue("high", Exchange("high"), routing_key="high"),
    Queue("normal", Exchange("normal"), routing_key="normal"),
    Queue("low", Exchange("low"), routing_key="low"),
)

task_default_queue = "normal"
task_default_exchange = "normal"
task_default_routing_key = "normal"

task_ignore_result = True

# TODO: configure later
# CELERY_ROUTES = {
#     # -- HIGH PRIORITY QUEUE -- #
#     'myapp.tasks.check_payment_status': {'queue': 'high'},
#     # -- LOW PRIORITY QUEUE -- #
#     'myapp.tasks.close_session': {'queue': 'low'},
# }
