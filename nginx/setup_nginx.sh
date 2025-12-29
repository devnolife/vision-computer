#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Nginx Setup Script for Anti-Plagiasi System
# Created by devnolife
# ═══════════════════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_CONF_DIR="/etc/nginx"
NGINX_SITES_AVAILABLE="$NGINX_CONF_DIR/sites-available"
NGINX_SITES_ENABLED="$NGINX_CONF_DIR/sites-enabled"

show_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║     ███╗   ██╗ ██████╗ ██╗███╗   ██╗██╗  ██╗                     ║"
    echo "║     ████╗  ██║██╔════╝ ██║████╗  ██║╚██╗██╔╝                     ║"
    echo "║     ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║ ╚███╔╝                      ║"
    echo "║     ██║╚██╗██║██║   ██║██║██║╚██╗██║ ██╔██╗                      ║"
    echo "║     ██║ ╚████║╚██████╔╝██║██║ ╚████║██╔╝ ██╗                     ║"
    echo "║     ╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝                     ║"
    echo "║                                                                   ║"
    echo "║          ${WHITE}${BOLD}NGINX SETUP FOR RUMAH PLAGIASI${CYAN}${BOLD}                      ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${MAGENTA}${BOLD}           ⚡ Crafted with passion by devnolife ⚡${NC}"
    echo ""
}

log_step() {
    echo -e "${BOLD}${BLUE}[STEP] ${NC}$1${NC}"
}

log_success() {
    echo -e "${GREEN}${BOLD}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}${BOLD}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${BOLD}⚠️  $1${NC}"
}

log_info() {
    echo -e "${CYAN}${DIM}ℹ️  $1${NC}"
}

press_enter() {
    echo ""
    echo -e "${DIM}Press Enter to continue...${NC}"
    read
}

# ═══════════════════════════════════════════════════════════════════
# INSTALLATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

install_nginx() {
    log_step "Installing Nginx..."
    echo ""

    if command -v nginx &> /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1 | awk -F/ '{print $2}')
        log_success "Nginx is already installed (version: $NGINX_VERSION)"
        return 0
    fi

    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}Installing Nginx via apt...${NC}"
        sudo apt-get update -qq
        sudo apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        echo -e "${CYAN}Installing Nginx via yum...${NC}"
        sudo yum install -y nginx
    elif command -v brew &> /dev/null; then
        echo -e "${CYAN}Installing Nginx via Homebrew...${NC}"
        brew install nginx
    else
        log_error "Cannot determine package manager. Please install Nginx manually."
        return 1
    fi

    if command -v nginx &> /dev/null; then
        log_success "Nginx installed successfully"
        return 0
    else
        log_error "Failed to install Nginx"
        return 1
    fi
}

setup_nginx_config() {
    log_step "Setting up Nginx configuration..."
    echo ""

    # Check if nginx config exists
    if [ ! -f "$PROJECT_ROOT/nginx/rumahplagiasi.conf" ]; then
        log_error "Nginx config file not found at $PROJECT_ROOT/nginx/rumahplagiasi.conf"
        return 1
    fi

    # Create sites-available and sites-enabled if they don't exist
    sudo mkdir -p "$NGINX_SITES_AVAILABLE" "$NGINX_SITES_ENABLED"

    # Copy configuration
    echo -e "${CYAN}Copying Nginx configuration...${NC}"
    sudo cp "$PROJECT_ROOT/nginx/rumahplagiasi.conf" "$NGINX_SITES_AVAILABLE/rumahplagiasi.conf"
    log_success "Configuration copied to $NGINX_SITES_AVAILABLE/"

    # Create symlink
    if [ -L "$NGINX_SITES_ENABLED/rumahplagiasi.conf" ]; then
        sudo rm "$NGINX_SITES_ENABLED/rumahplagiasi.conf"
    fi
    sudo ln -s "$NGINX_SITES_AVAILABLE/rumahplagiasi.conf" "$NGINX_SITES_ENABLED/rumahplagiasi.conf"
    log_success "Symlink created in $NGINX_SITES_ENABLED/"

    # Remove default site if exists
    if [ -L "$NGINX_SITES_ENABLED/default" ]; then
        log_warning "Removing default Nginx site..."
        sudo rm "$NGINX_SITES_ENABLED/default"
    fi

    # Test configuration
    echo ""
    log_step "Testing Nginx configuration..."
    if sudo nginx -t; then
        log_success "Nginx configuration is valid"
    else
        log_error "Nginx configuration test failed"
        return 1
    fi

    echo ""
    return 0
}

start_nginx() {
    log_step "Starting Nginx..."
    
    if pgrep -x "nginx" > /dev/null; then
        log_warning "Nginx is already running. Reloading..."
        sudo nginx -s reload
        log_success "Nginx reloaded successfully"
    else
        sudo systemctl start nginx 2>/dev/null || sudo nginx
        if pgrep -x "nginx" > /dev/null; then
            log_success "Nginx started successfully"
        else
            log_error "Failed to start Nginx"
            return 1
        fi
    fi
    return 0
}

stop_nginx() {
    log_step "Stopping Nginx..."
    
    if pgrep -x "nginx" > /dev/null; then
        sudo systemctl stop nginx 2>/dev/null || sudo nginx -s stop
        sleep 1
        if ! pgrep -x "nginx" > /dev/null; then
            log_success "Nginx stopped successfully"
        else
            log_warning "Nginx may still be running"
        fi
    else
        log_info "Nginx is not running"
    fi
}

restart_nginx() {
    log_step "Restarting Nginx..."
    sudo systemctl restart nginx 2>/dev/null || (sudo nginx -s stop; sleep 1; sudo nginx)
    if pgrep -x "nginx" > /dev/null; then
        log_success "Nginx restarted successfully"
    else
        log_error "Failed to restart Nginx"
        return 1
    fi
}

reload_nginx() {
    log_step "Reloading Nginx configuration..."
    if sudo nginx -t; then
        sudo nginx -s reload
        log_success "Nginx configuration reloaded"
    else
        log_error "Configuration test failed. Not reloading."
        return 1
    fi
}

status_nginx() {
    echo -e "${BOLD}${CYAN}📊 Nginx Status:${NC}"
    echo ""
    
    if pgrep -x "nginx" > /dev/null; then
        local pid=$(pgrep -x "nginx" | head -1)
        echo -e "${DIM}├─${NC} ${WHITE}Status${NC}         ${GREEN}${BOLD}● RUNNING${NC}"
        echo -e "${DIM}├─${NC} ${WHITE}Master PID${NC}     ${CYAN}$pid${NC}"
        echo -e "${DIM}├─${NC} ${WHITE}Workers${NC}        ${CYAN}$(pgrep -x "nginx" | wc -l)${NC}"
        
        # Check if listening on port 80
        if netstat -tlnp 2>/dev/null | grep -q ":80.*nginx" || ss -tlnp 2>/dev/null | grep -q ":80.*nginx"; then
            echo -e "${DIM}├─${NC} ${WHITE}Port 80${NC}        ${GREEN}✓ Listening${NC}"
        else
            echo -e "${DIM}├─${NC} ${WHITE}Port 80${NC}        ${YELLOW}○ Not listening${NC}"
        fi
        
        echo -e "${DIM}└─${NC} ${WHITE}Config${NC}         ${CYAN}/etc/nginx/sites-enabled/rumahplagiasi.conf${NC}"
    else
        echo -e "${DIM}├─${NC} ${WHITE}Status${NC}         ${RED}${BOLD}⭘ NOT RUNNING${NC}"
    fi
    echo ""
}

setup_ssl() {
    log_step "Setting up SSL with Let's Encrypt..."
    echo ""

    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot not installed. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y certbot python3-certbot-nginx
        else
            log_error "Please install certbot manually"
            return 1
        fi
    fi

    echo -e "${YELLOW}${BOLD}Enter your domain name:${NC}"
    read -p "Domain (e.g., rumahplagiasi.com): " DOMAIN

    if [ -z "$DOMAIN" ]; then
        log_error "Domain name is required"
        return 1
    fi

    echo ""
    log_step "Obtaining SSL certificate for $DOMAIN..."
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN"

    if [ $? -eq 0 ]; then
        log_success "SSL certificate installed successfully!"
        log_info "Certificate will auto-renew via certbot timer"
    else
        log_error "Failed to obtain SSL certificate"
    fi
}

show_menu() {
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🎯 Nginx Management Menu:${NC}"
    echo ""
    echo -e "  ${GREEN}${BOLD}[1]${NC} 📦 ${WHITE}Install Nginx${NC}              ${DIM}Install Nginx if not present${NC}"
    echo -e "  ${GREEN}${BOLD}[2]${NC} ⚙️  ${WHITE}Setup Configuration${NC}        ${DIM}Copy and enable site config${NC}"
    echo -e "  ${GREEN}${BOLD}[3]${NC} 🚀 ${WHITE}Full Setup${NC}                 ${DIM}Install + Configure + Start${NC}"
    echo ""
    echo -e "  ${BLUE}${BOLD}[4]${NC} ▶️  ${WHITE}Start Nginx${NC}                ${DIM}Start Nginx server${NC}"
    echo -e "  ${YELLOW}${BOLD}[5]${NC} ⏸️  ${WHITE}Stop Nginx${NC}                 ${DIM}Stop Nginx server${NC}"
    echo -e "  ${YELLOW}${BOLD}[6]${NC} 🔄 ${WHITE}Restart Nginx${NC}              ${DIM}Restart Nginx server${NC}"
    echo -e "  ${BLUE}${BOLD}[7]${NC} 🔃 ${WHITE}Reload Config${NC}              ${DIM}Reload without downtime${NC}"
    echo ""
    echo -e "  ${MAGENTA}${BOLD}[8]${NC} 📊 ${WHITE}Status${NC}                     ${DIM}Check Nginx status${NC}"
    echo -e "  ${MAGENTA}${BOLD}[9]${NC} 📋 ${WHITE}View Logs${NC}                  ${DIM}View access/error logs${NC}"
    echo -e "  ${MAGENTA}${BOLD}[10]${NC} ✅ ${WHITE}Test Config${NC}               ${DIM}Validate configuration${NC}"
    echo ""
    echo -e "  ${CYAN}${BOLD}[11]${NC} 🔒 ${WHITE}Setup SSL${NC}                  ${DIM}Install Let's Encrypt SSL${NC}"
    echo ""
    echo -e "  ${RED}${BOLD}[0]${NC} 🚪 ${WHITE}Exit${NC}"
    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

view_logs() {
    echo -e "${BOLD}${CYAN}Select log to view:${NC}"
    echo ""
    echo -e "  ${GREEN}${BOLD}[1]${NC} 📋 ${WHITE}Access Log${NC}"
    echo -e "  ${RED}${BOLD}[2]${NC} ⚠️  ${WHITE}Error Log${NC}"
    echo -e "  ${BLUE}${BOLD}[3]${NC} 📊 ${WHITE}Both (tail -f)${NC}"
    echo -e "  ${YELLOW}${BOLD}[0]${NC} 🔙 ${WHITE}Back${NC}"
    echo ""
    echo -ne "${BOLD}${WHITE}Select [0-3]: ${NC}"
    read -r log_choice

    case $log_choice in
        1) sudo tail -100 /var/log/nginx/rumahplagiasi_access.log 2>/dev/null || sudo tail -100 /var/log/nginx/access.log ;;
        2) sudo tail -100 /var/log/nginx/rumahplagiasi_error.log 2>/dev/null || sudo tail -100 /var/log/nginx/error.log ;;
        3) 
            echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
            sudo tail -f /var/log/nginx/*.log
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

test_config() {
    log_step "Testing Nginx configuration..."
    echo ""
    sudo nginx -t
    echo ""
}

full_setup() {
    show_banner
    echo -e "${BOLD}${GREEN}🚀 Full Nginx Setup${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Step 1: Install Nginx
    echo -e "${CYAN}${BOLD}Step 1/3: Installing Nginx...${NC}"
    install_nginx
    echo ""

    # Step 2: Setup configuration
    echo -e "${CYAN}${BOLD}Step 2/3: Setting up configuration...${NC}"
    setup_nginx_config
    echo ""

    # Step 3: Start Nginx
    echo -e "${CYAN}${BOLD}Step 3/3: Starting Nginx...${NC}"
    start_nginx
    echo ""

    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎉 NGINX SETUP COMPLETED! 🎉${NC}"
    echo ""

    status_nginx

    echo -e "${BOLD}${CYAN}🌐 Your application is now accessible at:${NC}"
    echo -e "${DIM}├─${NC} ${WHITE}HTTP${NC}   ${GREEN}http://localhost${NC}"
    echo -e "${DIM}└─${NC} ${WHITE}HTTPS${NC}  ${YELLOW}Configure SSL with option [11]${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════════

main() {
    while true; do
        show_banner
        show_menu

        echo -ne "${BOLD}${WHITE}Select option [0-11]: ${NC}"
        read -r choice

        case $choice in
            1) 
                show_banner
                install_nginx
                press_enter
                ;;
            2) 
                show_banner
                setup_nginx_config
                press_enter
                ;;
            3) 
                full_setup
                press_enter
                ;;
            4) 
                show_banner
                start_nginx
                press_enter
                ;;
            5) 
                show_banner
                stop_nginx
                press_enter
                ;;
            6) 
                show_banner
                restart_nginx
                press_enter
                ;;
            7) 
                show_banner
                reload_nginx
                press_enter
                ;;
            8) 
                show_banner
                status_nginx
                press_enter
                ;;
            9) 
                show_banner
                view_logs
                press_enter
                ;;
            10) 
                show_banner
                test_config
                press_enter
                ;;
            11) 
                show_banner
                setup_ssl
                press_enter
                ;;
            0)
                show_banner
                echo -e "${GREEN}${BOLD}👋 Goodbye!${NC}"
                echo ""
                exit 0
                ;;
            *)
                echo ""
                echo -e "${RED}${BOLD}❌ Invalid option. Please choose 0-11.${NC}"
                sleep 2
                ;;
        esac
    done
}

# Run with argument support
if [ "$1" == "install" ]; then
    install_nginx
elif [ "$1" == "setup" ]; then
    setup_nginx_config
elif [ "$1" == "start" ]; then
    start_nginx
elif [ "$1" == "stop" ]; then
    stop_nginx
elif [ "$1" == "restart" ]; then
    restart_nginx
elif [ "$1" == "reload" ]; then
    reload_nginx
elif [ "$1" == "status" ]; then
    status_nginx
elif [ "$1" == "full" ]; then
    full_setup
elif [ "$1" == "ssl" ]; then
    setup_ssl
else
    main
fi
