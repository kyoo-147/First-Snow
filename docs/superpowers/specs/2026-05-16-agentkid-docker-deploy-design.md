---
title: AgentKid Docker Deploy Automation Design
date: 2026-05-16
status: draft-for-review
---

# AgentKid Docker Deploy Automation Design

## 1. Goal
Thiết kế một quy trình deploy chuẩn cho repo `agentkid` theo hướng:

- code tại local
- build Docker image sau mỗi mốc hoàn thành
- push image lên Docker Hub
- từ server chính pull image về và chạy để kiểm tra
- để Codex có thể tự đọc quy trình, dùng lại thông tin hạ tầng, và thực hiện deploy ổn định qua các lần sau

Thiết kế này chỉ áp dụng cho repo `D:/working/agentkid`.

## 2. Scope
Thiết kế bao gồm:

- tài liệu canonical cho workflow deploy
- cấu hình cục bộ bị `gitignore` để lưu thông tin vận hành và bí mật
- script triển khai lặp lại trong repo
- repo-local skill để Codex hiểu và tuân thủ workflow deploy của dự án
- bootstrap lần đầu cho server Ubuntu 22.04 dùng reverse proxy và Docker

Thiết kế này chưa bao gồm:

- triển khai CI/CD tự động từ GitHub Actions
- nhiều môi trường độc lập ngoài server chính
- tự động scale hoặc orchestration kiểu Kubernetes
- chính sách secrets manager tập trung bên ngoài file cục bộ

## 3. Decision Summary
Các quyết định đã chốt:

- dùng hướng `docs + local config + repo-local skill + scripts`
- chỉ dùng cho repo `agentkid`
- thông tin nhạy cảm được lưu trong file cục bộ bị `gitignore`
- deploy thẳng lên server chính để test và kiểm soát
- server đích là `navin@34.55.68.105`
- hệ điều hành server là `Ubuntu 22.04`
- public app URL là `https://app.agentkid.io.vn`
- reverse proxy mặc định là `Caddy`
- Docker Hub namespace là `macdaiqua147`

## 4. Design Principles

### 4.1 Repeatability First
Mọi lần deploy phải có cùng một chuỗi hành động và cùng điểm kiểm tra, tránh phụ thuộc vào trí nhớ hoặc thao tác SSH thủ công ngẫu hứng.

### 4.2 Immutable Release Identity
Server phải chạy image được tag theo định danh bất biến, mặc định là commit SHA rút gọn, để rollback và truy vết dễ dàng.

### 4.3 Repo as Operational Memory
Repo phải chứa đủ tài liệu, skill, script, và schema config để Codex có thể tái hiện quy trình ở các phiên sau mà không phải hỏi lại toàn bộ bối cảnh.

### 4.4 Local Secrets Only
Secrets và thông tin nhạy cảm không được commit vào git và không được hardcode trong skill. Skill chỉ được hướng dẫn cách đọc file cục bộ hoặc file state cục bộ.

### 4.5 Guardrails for Primary Server
Vì test diễn ra trên server chính, mọi thao tác có khả năng ảnh hưởng dịch vụ phải có guardrail rõ ràng: xác định image tag, xác định compose project, kiểm tra health, xem log, và rollback nếu cần.

## 5. Target Topology

### 5.1 Runtime Topology
Mô hình server mục tiêu:

- `Caddy` làm reverse proxy public entrypoint
- app container chạy phía sau trên Docker network nội bộ
- về sau có thể thêm `worker` container cùng stack mà không đổi workflow cốt lõi

Luồng truy cập:

1. người dùng đi vào `https://app.agentkid.io.vn`
2. DNS trỏ về `34.55.68.105`
3. `Caddy` terminate TLS và reverse proxy sang app container
4. app container phục vụ web/BFF

### 5.2 Initial Deployment Mode
Giai đoạn đầu ưu tiên một stack tối giản:

- một image `web`
- một compose project
- một reverse proxy `Caddy`
- healthcheck cơ bản để xác nhận server chạy đúng

Worker được chuẩn bị sẵn trong naming và config contract, nhưng có thể chưa bật ở lần bootstrap đầu.

## 6. Repository Structure

### 6.1 Documentation
- `docs/operations/deployment-workflow.md`
  Canonical workflow cho build, push, deploy, smoke test, log inspection, rollback, và nguyên tắc guardrail.

- `docs/operations/server-topology.md`
  Canonical mô tả topology server, domain, reverse proxy, Docker network, và các đường dẫn vận hành chính.

### 6.2 Deployment Assets
- `infra/deploy/deploy.config.template.json`
  Schema mẫu cho cấu hình deploy không chứa secret.

- `infra/deploy/deploy.config.local.json`
  File cấu hình thật, cục bộ, bị `gitignore`.

- `infra/deploy/build-and-push.ps1`
  Script build image và push lên Docker Hub.

- `infra/deploy/deploy-server.ps1`
  Script SSH lên server, pull đúng image tag, chạy hoặc cập nhật stack, và gọi smoke test.

- `infra/deploy/smoke-check.ps1`
  Script kiểm tra container, HTTP health, route công khai, và tín hiệu lỗi cơ bản trong log.

- `infra/deploy/rollback.ps1`
  Script rollback về image tag gần nhất đã biết là ổn.

- `infra/deploy/server/`
  Chứa các artifact phục vụ bootstrap lần đầu, như compose file và Caddyfile template.

### 6.3 Repo-Local Skill
- `skills/agentkid-docker-deploy/SKILL.md`
  Skill nội bộ của repo mô tả cách Codex phải đọc docs, đọc config, build, push, deploy, check, và rollback.

### 6.4 Ignore Rules
`.gitignore` phải bỏ qua:

- `infra/deploy/deploy.config.local.json`
- các file state cục bộ phát sinh nếu có, ví dụ file lưu tag deploy gần nhất

## 7. Configuration Contract

### 7.1 Template File
`infra/deploy/deploy.config.template.json` phải là schema thực tế để người dùng điền vào, không phải mô tả chung chung.

### 7.2 Local File
`infra/deploy/deploy.config.local.json` là nguồn vận hành chính cho Codex và script.

Nội dung tối thiểu nên có:

```json
{
  "project": {
    "name": "agentkid",
    "publicAppUrl": "https://app.agentkid.io.vn"
  },
  "dockerHub": {
    "namespace": "macdaiqua147"
  },
  "images": {
    "web": "macdaiqua147/agentkid-web",
    "worker": "macdaiqua147/agentkid-worker"
  },
  "server": {
    "sshUser": "navin",
    "sshHost": "34.55.68.105",
    "appDir": "/opt/agentkid",
    "composeProjectName": "agentkid-prod",
    "os": "ubuntu-22.04"
  },
  "proxy": {
    "type": "caddy",
    "domain": "app.agentkid.io.vn"
  },
  "healthchecks": {
    "publicUrl": "https://app.agentkid.io.vn",
    "internalPath": "/",
    "expectedStatusCodes": [200, 301, 302]
  },
  "deploy": {
    "defaultTarget": "primary",
    "tagStrategy": "git-sha",
    "rollbackStateFile": "infra/deploy/.state/last-known-good.json"
  }
}
```

Thiết kế cho phép mở rộng thêm field, nhưng các script và skill phải phụ thuộc vào contract rõ ràng, không dựa vào parsing ngẫu nhiên.

## 8. Image Naming and Tagging

### 8.1 Image Names
Image mặc định:

- `macdaiqua147/agentkid-web`
- `macdaiqua147/agentkid-worker`

### 8.2 Tagging Rules
Tag chuẩn cho mỗi deploy là immutable tag theo commit SHA:

- `git-<shortsha>`

Ví dụ:

- `git-a1b2c3d`

Có thể thêm tag convenience sau này như `prod-latest`, nhưng không được dùng làm nguồn quyết định rollback hoặc audit.

### 8.3 Rollback Reference
Mỗi lần deploy thành công phải cập nhật state cục bộ hoặc state trên server để biết tag ổn định gần nhất có thể rollback.

## 9. Standard Deployment Workflow

### 9.1 Pre-Deploy Read Sequence
Trước khi deploy, Codex phải đọc theo thứ tự:

1. `README.md`
2. `PROJECT_OVERVIEW.md`
3. `ARCHITECTURE.md`
4. `DEPLOYMENT_GUIDE.md`
5. `docs/operations/deployment-workflow.md`
6. `docs/operations/server-topology.md`
7. `infra/deploy/deploy.config.local.json`
8. skill `skills/agentkid-docker-deploy/SKILL.md`

### 9.2 Execution Flow
Workflow deploy chuẩn:

1. chạy verify cục bộ phù hợp với thay đổi
2. build image cho app
3. gắn immutable tag theo commit SHA
4. push image lên Docker Hub
5. SSH vào server chính
6. pull đúng tag vừa build
7. cập nhật stack bằng Docker Compose
8. kiểm tra container và route nội bộ
9. kiểm tra public URL `https://app.agentkid.io.vn`
10. nếu lỗi, thu thập log và rollback

### 9.3 First Bootstrap Flow
Lần đầu bootstrap server cần thêm:

1. cài Docker Engine và Docker Compose plugin
2. tạo thư mục vận hành trên server, mặc định `/opt/agentkid`
3. ghi file compose và Caddyfile
4. khởi chạy stack reverse proxy + app
5. kiểm tra DNS và TLS
6. chạy smoke test sau bootstrap

## 10. Guardrails

### 10.1 No Unstructured Manual Deploy
Codex không được SSH vào server và thao tác triển khai tùy hứng khi đã có script và convention trong repo, trừ khi đang debug sự cố và phải ghi rõ lý do.

### 10.2 Confirm High-Risk Changes
Codex phải dừng để xác nhận người dùng nếu phiên làm việc bao gồm:

- bootstrap server lần đầu
- thay đổi topology reverse proxy
- thay đổi đường dẫn vận hành chính
- thay đổi domain public
- thay đổi image naming hoặc tag policy
- rollout có thể gây downtime rõ ràng

### 10.3 Post-Deploy Verification Is Mandatory
Không được coi deploy là xong nếu chưa có:

- container running check
- HTTP response check
- public URL smoke test
- log scan cơ bản

### 10.4 Rollback Before Hotfix-on-Server
Nếu deploy hỏng trên server chính, ưu tiên rollback về image ổn định gần nhất trước khi cân nhắc sửa nóng trực tiếp trên server.

## 11. Smoke Test Contract
Smoke test cơ bản phải bao phủ:

- app container đang chạy
- reverse proxy container đang chạy nếu tách container
- public URL phản hồi được
- route nội bộ phản hồi đúng
- log không có lỗi crash-loop rõ ràng

Nếu sau này app có endpoint sức khỏe riêng như `/api/health`, script nên chuyển sang endpoint đó thay vì chỉ kiểm tra `/`.

## 12. Reverse Proxy Decision
`Caddy` được chọn làm reverse proxy mặc định vì:

- cấu hình gọn
- tự xử lý TLS dễ hơn
- phù hợp cho bootstrap server nhanh và lặp lại
- giảm ma sát vận hành so với tự cấu hình TLS thủ công

## 13. Repo-Local Skill Behavior
Skill `agentkid-docker-deploy` phải hướng dẫn Codex:

- khi nào skill này cần được dùng
- đọc canonical docs nào trước
- đọc config cục bộ nào
- build và tag image theo chuẩn nào
- deploy bằng script và compose thay vì thao tác ngẫu nhiên
- kiểm tra gì sau deploy
- xử lý rollback thế nào
- khi nào phải yêu cầu xác nhận thủ công

Skill không được chứa secret cụ thể.

## 14. Implementation Plan Preview
Sau khi spec được duyệt, phần implementation nên đi theo thứ tự:

1. tạo docs operations canonical
2. tạo template config và ignore rules
3. tạo server bootstrap assets
4. tạo script build, deploy, smoke, rollback
5. tạo repo-local skill
6. validate workflow end-to-end với server thật

## 15. Risks

### 15.1 Primary Server Testing Risk
Vì test diễn ra trên server chính, rollout lỗi có thể ảnh hưởng phiên bản đang chạy. Guardrail và rollback là bắt buộc.

### 15.2 TLS/DNS Bootstrap Risk
Nếu DNS hoặc firewall chưa đúng, reverse proxy có thể khởi động nhưng public HTTPS chưa hoạt động hoàn chỉnh.

### 15.3 Repo Still Early
Repo hiện chưa scaffold production runtime đầy đủ, nên phần deploy automation cần đi kèm giả định rõ về app container đầu tiên.

## 16. Success Criteria
Thiết kế được coi là thành công khi:

- Codex có thể tìm thấy đầy đủ workflow deploy trong repo
- Codex có thể đọc file config cục bộ để biết server và registry phải dùng
- một lệnh hoặc một chuỗi lệnh chuẩn có thể build và push image mới
- một lệnh hoặc một chuỗi lệnh chuẩn có thể pull image và cập nhật server
- sau deploy, Codex có thể tự kiểm tra tình trạng ứng dụng và báo kết quả
- rollback có đường đi rõ ràng và tái sử dụng được
