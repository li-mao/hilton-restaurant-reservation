#!/bin/bash

# 希尔顿餐厅预订系统 - 一键部署脚本
# 包含完整的初始化、健康检查和错误处理

set -e  # 遇到错误立即退出

echo "🚀 希尔顿餐厅预订系统部署开始..."
echo "====================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "未检测到 Docker Compose v2（docker compose）。请安装 Docker Compose 插件。"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker compose down --remove-orphans 2>/dev/null || true
    log_success "现有服务已停止"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    docker system prune -f 2>/dev/null || true
    log_success "资源清理完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker compose up -d
    
    log_info "等待服务启动..."
    sleep 10
    
    log_success "服务启动完成"
}

# 等待后端服务
wait_for_backend() {
    log_info "等待后端服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
            log_success "后端服务就绪"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_warning "后端服务启动超时，继续检查..."
    return 1
}

# 等待前端服务
wait_for_frontend() {
    log_info "等待前端服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            log_success "前端服务就绪"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_warning "前端服务启动超时，继续检查..."
    return 1
}

# 执行健康检查
health_check() {
    log_info "执行系统健康检查..."
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker compose ps
    
    # 检查后端健康状态
    log_info "检查后端健康状态..."
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        log_success "后端健康检查通过"
    else
        log_warning "后端健康检查失败，但服务可能仍在启动中"
    fi
    
    # 检查前端服务
    log_info "检查前端服务..."
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_warning "前端服务可能仍在启动中"
    fi
}

# 数据库连接重试
retry_database_connection() {
    log_info "尝试重新连接数据库..."
    
    # 重启后端服务
    log_info "重启后端服务..."
    docker compose restart backend
    
    # 等待后端服务启动
    log_info "等待后端服务启动..."
    sleep 30
    
    # 检查连接状态
    if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
        log_success "数据库连接成功"
        return 0
    else
        log_warning "数据库连接仍然失败，请检查 MongoDB 服务与网络配置"
        return 1
    fi
}

# 显示部署结果
show_results() {
    echo ""
    echo "====================================="
    log_success "部署完成！"
    echo "====================================="
    echo ""
    echo "🌐 访问地址："
    echo "   前端应用: http://localhost:3000"
    echo "   后端API:  http://localhost:5000"
    echo "   MongoDB:   mongodb://localhost:27017"
    echo ""
    echo "👤 默认管理员账户："
    echo "   邮箱: admin@hilton.com"
    echo "   密码: admin123"
    echo ""
    echo "🔧 管理命令："
    echo "   查看日志: docker compose logs -f"
    echo "   停止服务: docker compose down"
    echo "   重启服务: docker compose restart"
    echo "   健康检查: node scripts/health-check.js"
    echo ""
    echo "====================================="
}

# 错误处理
handle_error() {
    log_error "部署过程中出现错误！"
    echo ""
    echo "🔍 故障排除："
    echo "1. 检查Docker服务是否运行: sudo systemctl status docker"
    echo "2. 查看服务日志: docker compose logs"
    echo "3. 检查端口占用: netstat -tulpn | grep :3000"
    echo "4. 重启Docker服务: sudo systemctl restart docker"
    echo "5. 检查 MongoDB: docker compose logs mongodb"
    echo ""
    exit 1
}

# 设置错误处理
trap handle_error ERR

# 主执行流程
main() {
    check_docker
    stop_services
    cleanup
    start_services
    
    # 等待其他服务
    wait_for_backend
    wait_for_frontend
    
    # 执行健康检查
    health_check
    
    # 如果数据库连接失败，尝试重试
    if ! curl -s http://localhost:5000/api/health | grep -q "healthy"; then
        log_warning "检测到数据库连接问题，尝试修复..."
        if retry_database_connection; then
            log_success "数据库连接修复成功"
        else
            log_error "数据库连接修复失败，请手动检查 MongoDB 服务"
        fi
    fi
    
    show_results
}

# 执行主流程
main "$@"