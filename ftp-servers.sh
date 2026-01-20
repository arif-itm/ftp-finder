#!/bin/bash

# =================CONFIGURATION=================

RCLONE_CMD="serve http"

# Define remotes [PORT]="REMOTE_NAME"
declare -A REMOTES=(
  [9001]="DHAKA-FLIX-7:"
  [9002]="DHAKA-FLIX-9:"
  [9003]="DHAKA-FLIX-12:"
  [9004]="DHAKA-FLIX-14:"
)

FLAGS=(
  --read-only
  --vfs-cache-mode full
  --vfs-cache-max-size 500M
  --vfs-cache-max-age 1h
  --buffer-size 12M
  --vfs-read-ahead 32M
  --no-checksum
  --no-modtime
  --addr 0.0.0.0:#PORT
)

# =================LOGIC=================

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}>>> Starting Rclone Instances...${NC}"

for port in "${!REMOTES[@]}"; do
    remote="${REMOTES[$port]}"
    
    # Prepare flags
    instance_flags=()
    for flag in "${FLAGS[@]}"; do
        instance_flags+=("${flag//#PORT/$port}")
    done

    # Start instance
    nohup rclone $RCLONE_CMD "$remote" "${instance_flags[@]}" > "rclone-$port.log" 2>&1 &
    
    echo -e "Started ${GREEN}$remote${NC} on Port ${GREEN}$port${NC}"
done

echo "---------------------------------------------------"
echo -e "${BLUE}>>> Current Status:${NC}"
sleep 1 # Wait a moment for processes to initialize
if pgrep -a rclone > /dev/null; then
    pgrep -a rclone | grep "serve http"
else
    echo -e "${RED}No Rclone processes found! Check logs.${NC}"
fi
echo "---------------------------------------------------"

# Wait for user input
echo -e "${RED}WARNING: Choosing Yes will kill ALL Rclone processes on this server.${NC}"
read -p "Do you want to stop all instances now? (Y/n): " confirm
confirm=${confirm:-y}

if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${RED}>>> Killing all rclone processes...${NC}"
    pkill -f rclone
    echo -e "${BLUE}All rclone instances stopped.${NC}"
else
    echo -e "${GREEN}Instances left running in background.${NC}"
fi