import re

with open('trendmap_api/models.py', 'r') as f:
    content = f.read()

# Define the models to remove
models_to_remove = [
    'AuthGroup',
    'AuthGroupPermissions',
    'AuthPermission',
    'AuthUser',
    'AuthUserGroups',
    'AuthUserUserPermissions',
    'DjangoAdminLog',
    'DjangoContentType',
    'DjangoMigrations',
    'DjangoSession',
    'AlembicVersion'
]

# We use regex to completely strip out these classes
for model in models_to_remove:
    # regex matches: class ModelName(models.Model): \n ... \n\n
    pattern = rf'^class {model}\(models\.Model\):.*?(?=(?:^class |^$|\Z))'
    content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)

with open('trendmap_api/models.py', 'w') as f:
    f.write(content)

print("Django internal models removed.")
