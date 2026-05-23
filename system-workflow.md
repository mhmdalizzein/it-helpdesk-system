# System Workflows

## 1. Login / Authentication Workflow

```mermaid
flowchart TD
    A[User opens the system] --> B[Login page]
    B --> C[Enter email and password]
    C --> D[Submit login form]
    D --> E[System validates credentials]

    E --> F{Credentials valid?}
    F -- No --> G[Show login error]
    G --> B

    F -- Yes --> H[Generate JWT token]
    H --> I[Load user role]
    I --> J{User role}

    J -- Employee --> K[Redirect to Employee Dashboard]
    J -- IT Support Agent --> L[Redirect to Agent Dashboard]
    J -- Manager --> M[Redirect to Manager Dashboard]
    J -- Admin --> N[Redirect to Admin Dashboard]

    K --> O[User accesses protected pages]
    L --> O
    M --> O
    N --> O
```

## 2. Employee Create Ticket Workflow

```mermaid
flowchart TD
    A[Employee logs in] --> B[Open dashboard]
    B --> C[Click Create Ticket]
    C --> D[Fill ticket title and description]
    D --> E[Select category]
    E --> F[Select priority]
    F --> G{Attach file?}

    G -- Yes --> H[Upload screenshot or document]
    H --> I[System validates file]
    I --> J{File valid?}
    J -- No --> K[Show file error]
    K --> G
    J -- Yes --> L[Attach file to ticket]

    G -- No --> M[Submit ticket]
    L --> M

    M --> N[System validates ticket details]
    N --> O{Ticket valid?}
    O -- No --> P[Show validation errors]
    P --> D

    O -- Yes --> Q[Save ticket in database]
    Q --> R[Generate ticket reference number]
    R --> S[Set ticket status to Open]
    S --> T[Create ticket history record]
    T --> U[Notify IT support or admin]
    U --> V[Employee can track ticket status]
```

## 3. Ticket Assignment Workflow

```mermaid
flowchart TD
    A[Admin or Manager logs in] --> B[Open ticket dashboard]
    B --> C[View open tickets]
    C --> D[Select a ticket]
    D --> E[Review ticket details]
    E --> F[Choose IT Support Agent]
    F --> G[Assign ticket]

    G --> H[System checks permission]
    H --> I{Authorized?}
    I -- No --> J[Show access denied message]
    I -- Yes --> K[Update assigned agent]

    K --> L[Record assignment history]
    L --> M[Add activity log]
    M --> N[Notify assigned agent]
    N --> O[Ticket appears in agent dashboard]
    O --> P[Ticket status remains Open or changes to In Progress]
```

## 4. Ticket Resolution Workflow

```mermaid
flowchart TD
    A[IT Support Agent logs in] --> B[Open assigned tickets]
    B --> C[Select ticket]
    C --> D[Review issue details]
    D --> E[Update status to In Progress]
    E --> F[Add comment or internal note]
    F --> G[Work on issue]

    G --> H{Issue solved?}
    H -- No --> I[Request more information from employee]
    I --> J[Set status to Pending]
    J --> K[Notify employee]
    K --> L[Employee replies]
    L --> D

    H -- Yes --> M[Add resolution comment]
    M --> N[Set status to Resolved]
    N --> O[Notify employee]
    O --> P{Employee confirms solution?}

    P -- No --> Q[Reopen ticket]
    Q --> D

    P -- Yes --> R[Close ticket]
    R --> S[Save final activity log]
```

## 5. Ticket Comment / Reply Workflow

```mermaid
flowchart TD
    A[User opens ticket details] --> B[View ticket conversation]
    B --> C[Write comment or reply]
    C --> D{Is it an internal note?}

    D -- Yes --> E[Visible only to support/admin roles]
    D -- No --> F[Visible to employee and support team]

    E --> G[Submit comment]
    F --> G

    G --> H[System validates comment]
    H --> I{Comment valid?}
    I -- No --> J[Show validation error]
    J --> C

    I -- Yes --> K[Save comment in database]
    K --> L[Update ticket history]
    L --> M[Create activity log]
    M --> N[Notify related users]
    N --> O[Display new comment in ticket details]
```

## 6. Notification Workflow

```mermaid
flowchart TD
    A[Ticket action occurs] --> B{Action type}

    B -- Ticket created --> C[Create notification for admin or support]
    B -- Ticket assigned --> D[Create notification for assigned agent]
    B -- Status updated --> E[Create notification for employee]
    B -- Comment added --> F[Create notification for related user]
    B -- Ticket resolved --> G[Create notification for employee]

    C --> H[Save notification in database]
    D --> H
    E --> H
    F --> H
    G --> H

    H --> I[Show notification in notification center]
    I --> J{Email notification enabled?}

    J -- Yes --> K[Send email notification]
    J -- No --> L[End]

    K --> L
```

## 7. File Attachment Workflow

```mermaid
flowchart TD
    A[User opens ticket form or ticket details] --> B[Select file to upload]
    B --> C[System checks file type]
    C --> D{Supported file type?}

    D -- No --> E[Show unsupported file error]
    E --> B

    D -- Yes --> F[System checks file size]
    F --> G{File size allowed?}

    G -- No --> H[Show file size error]
    H --> B

    G -- Yes --> I[Upload file securely]
    I --> J[Save file path or reference]
    J --> K[Link attachment to ticket]
    K --> L[Save attachment record in database]
    L --> M[Show attachment in ticket details]

    M --> N{Authorized user wants to download?}
    N -- No --> O[No access]
    N -- Yes --> P[Allow secure download]
```

## 8. Admin User Management Workflow

```mermaid
flowchart TD
    A[Admin logs in] --> B[Open admin panel]
    B --> C[View users list]
    C --> D{Choose admin action}

    D -- Create user --> E[Enter user details]
    E --> F[Assign role]
    F --> G[Save new user]

    D -- Edit user --> H[Select existing user]
    H --> I[Update user details or role]
    I --> J[Save changes]

    D -- Deactivate user --> K[Select user]
    K --> L[Confirm deactivation]
    L --> M[Set user as inactive]

    G --> N[Record activity log]
    J --> N
    M --> N

    N --> O[Show success message]
    O --> P[Updated user list displayed]
```
