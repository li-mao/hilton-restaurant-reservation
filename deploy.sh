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
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker-compose down --remove-orphans 2>/dev/null || true
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
    docker-compose up -d
    
    log_info "等待服务启动..."
    sleep 10
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待Couchbase
    log_info "等待Couchbase服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T couchbase curl -s http://localhost:8091/pools/default >/dev/null 2>&1; then
            log_success "Couchbase服务就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Couchbase服务启动超时"
        exit 1
    fi
    
    # 等待后端服务
    log_info "等待后端服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:5000/health >/dev/null 2>&1; then
            log_success "后端服务就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_warning "后端服务启动超时，继续检查..."
    fi
    
    # 等待前端服务
    log_info "等待前端服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            log_success "前端服务就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_warning "前端服务启动超时，继续检查..."
    fi
}

# 执行健康检查
health_check() {
    log_info "执行系统健康检查..."
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker-compose ps
    
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
    echo "   数据库管理: http://localhost:8091"
    echo ""
    echo "👤 默认管理员账户："
    echo "   邮箱: admin@hilton.com"
    echo "   密码: admin123"
    echo ""
    echo "🔧 管理命令："
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
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
    echo "2. 查看服务日志: docker-compose logs"
    echo "3. 检查端口占用: netstat -tulpn | grep :3000"
    echo "4. 重启Docker服务: sudo systemctl restart docker"
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
    wait_for_services
    health_check
    show_results
}

# 执行主流程
main "$@"
