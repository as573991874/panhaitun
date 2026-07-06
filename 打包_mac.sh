#!/bin/bash
# 别按那个键 - macOS 打包工具

clear
echo "========================================"
echo "    别按那个键 - macOS 打包工具"
echo "========================================"
echo ""
echo "正在打包，请稍候..."
echo ""

cd "$(dirname "$0")"

# 执行 Electron Builder 打包 macOS 版本
npm run dist -- --mac

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "    打包成功！"
    echo "    输出目录：dist3/"
    echo "========================================"
    echo ""
    # 列出生成的文件
    echo "生成的文件："
    ls -la dist3/
else
    echo ""
    echo "========================================"
    echo "    打包失败，请查看上方错误信息"
    echo "========================================"
    echo ""
    exit 1
fi