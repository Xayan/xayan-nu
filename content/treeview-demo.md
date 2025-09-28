---
title: "TreeView Component Demo"
date: 2024-09-28T17:50:00Z
description: "Demonstration of the Svelte TreeView component integration with Hugo"
categories: ["comp-sci"]
tags: ["svelte", "demo", "ui-components"]
toc: true
hidden: false
comments: true
---

# TreeView Component Demo

This page demonstrates the integration of a Svelte TreeView component with Hugo using Vite as the build system. The TreeView component is powered by `@keenmate/svelte-treeview` and provides a rich, interactive hierarchical view of data.

## Basic TreeView

Here's a simple file system structure:

{{< treeview searchable="true" >}}
[
  {
    "id": "1",
    "path": "1",
    "name": "Documents",
    "icon": "📁",
    "description": "Main documents folder"
  },
  {
    "id": "1.1",
    "path": "1.1", 
    "name": "Projects",
    "icon": "📁",
    "description": "Work projects"
  },
  {
    "id": "1.1.1",
    "path": "1.1.1",
    "name": "Website Redesign",
    "icon": "🌐",
    "description": "Client website project"
  },
  {
    "id": "1.1.2",
    "path": "1.1.2",
    "name": "Mobile App",
    "icon": "📱",
    "description": "iOS/Android app"
  },
  {
    "id": "1.2",
    "path": "1.2",
    "name": "Reports",
    "icon": "📊",
    "description": "Monthly reports"
  },
  {
    "id": "2",
    "path": "2",
    "name": "Images",
    "icon": "🖼️",
    "description": "Photo collection"
  },
  {
    "id": "2.1",
    "path": "2.1",
    "name": "Vacation 2024",
    "icon": "🏖️",
    "description": "Summer vacation photos"
  },
  {
    "id": "2.2",
    "path": "2.2",
    "name": "Screenshots",
    "icon": "📸",
    "description": "UI screenshots"
  }
]
{{< /treeview >}}

## Company Organization Chart

This TreeView shows a fictional company's organizational structure:

{{< treeview searchable="true" >}}
[
  {
    "id": "ceo",
    "path": "1",
    "name": "CEO - Sarah Johnson",
    "icon": "👩‍💼",
    "description": "Chief Executive Officer"
  },
  {
    "id": "cto",
    "path": "1.1",
    "name": "CTO - Marcus Chen",
    "icon": "👨‍💻",
    "description": "Chief Technology Officer"
  },
  {
    "id": "dev-team",
    "path": "1.1.1",
    "name": "Development Team",
    "icon": "💻",
    "description": "Software developers"
  },
  {
    "id": "senior-dev-1",
    "path": "1.1.1.1",
    "name": "Alice Rodriguez",
    "icon": "👩‍💻",
    "description": "Senior Full-Stack Developer"
  },
  {
    "id": "senior-dev-2",
    "path": "1.1.1.2",
    "name": "Bob Smith",
    "icon": "👨‍💻",
    "description": "Senior Frontend Developer"
  },
  {
    "id": "junior-dev",
    "path": "1.1.1.3",
    "name": "Emma Wilson",
    "icon": "👩‍💻",
    "description": "Junior Developer"
  },
  {
    "id": "devops",
    "path": "1.1.2",
    "name": "DevOps Team",
    "icon": "⚙️",
    "description": "Infrastructure & deployment"
  },
  {
    "id": "devops-lead",
    "path": "1.1.2.1",
    "name": "David Kim",
    "icon": "👨‍🔧",
    "description": "DevOps Engineer"
  },
  {
    "id": "cmo",
    "path": "1.2",
    "name": "CMO - Lisa Brown",
    "icon": "👩‍💼",
    "description": "Chief Marketing Officer"
  },
  {
    "id": "marketing",
    "path": "1.2.1",
    "name": "Marketing Team",
    "icon": "📈",
    "description": "Digital marketing specialists"
  },
  {
    "id": "content-manager",
    "path": "1.2.1.1",
    "name": "Ryan Taylor",
    "icon": "✍️",
    "description": "Content Marketing Manager"
  },
  {
    "id": "social-media",
    "path": "1.2.1.2",
    "name": "Sophie Martinez",
    "icon": "📱",
    "description": "Social Media Specialist"
  }
]
{{< /treeview >}}

## Knowledge Base Structure

A TreeView representing a technical knowledge base:

{{< treeview searchable="true" >}}
[
  {
    "id": "kb-root",
    "path": "1",
    "name": "Technical Knowledge Base",
    "icon": "📚",
    "description": "Main knowledge repository"
  },
  {
    "id": "programming",
    "path": "1.1",
    "name": "Programming Languages",
    "icon": "💻",
    "description": "Language-specific guides"
  },
  {
    "id": "javascript",
    "path": "1.1.1",
    "name": "JavaScript",
    "icon": "🟨",
    "description": "JS fundamentals & frameworks"
  },
  {
    "id": "js-basics",
    "path": "1.1.1.1",
    "name": "JavaScript Basics",
    "icon": "📖",
    "description": "Variables, functions, objects"
  },
  {
    "id": "js-frameworks",
    "path": "1.1.1.2",
    "name": "Frameworks",
    "icon": "🏗️",
    "description": "React, Vue, Svelte"
  },
  {
    "id": "svelte",
    "path": "1.1.1.2.1",
    "name": "Svelte",
    "icon": "🧡",
    "description": "Component framework"
  },
  {
    "id": "react",
    "path": "1.1.1.2.2",
    "name": "React",
    "icon": "⚛️",
    "description": "UI library"
  },
  {
    "id": "python",
    "path": "1.1.2",
    "name": "Python",
    "icon": "🐍",
    "description": "Python programming"
  },
  {
    "id": "python-basics",
    "path": "1.1.2.1",
    "name": "Python Fundamentals",
    "icon": "📘",
    "description": "Syntax, data structures"
  },
  {
    "id": "django",
    "path": "1.1.2.2",
    "name": "Django",
    "icon": "🎯",
    "description": "Web framework"
  },
  {
    "id": "databases",
    "path": "1.2",
    "name": "Databases",
    "icon": "🗄️",
    "description": "Database systems"
  },
  {
    "id": "sql",
    "path": "1.2.1",
    "name": "SQL Databases",
    "icon": "📊",
    "description": "Relational databases"
  },
  {
    "id": "postgresql",
    "path": "1.2.1.1",
    "name": "PostgreSQL",
    "icon": "🐘",
    "description": "Advanced open-source DB"
  },
  {
    "id": "mysql",
    "path": "1.2.1.2",
    "name": "MySQL",
    "icon": "🐬",
    "description": "Popular web database"
  },
  {
    "id": "nosql",
    "path": "1.2.2",
    "name": "NoSQL Databases",
    "icon": "📈",
    "description": "Document & key-value stores"
  },
  {
    "id": "mongodb",
    "path": "1.2.2.1",
    "name": "MongoDB",
    "icon": "🍃",
    "description": "Document database"
  }
]
{{< /treeview >}}

## Features Demonstrated

This page showcases several key features of the TreeView component:

1. **Hierarchical Data Display**: Shows nested structures with clear parent-child relationships
2. **Search Functionality**: Each TreeView includes a search box for filtering nodes
3. **Custom Icons**: Each node can have a custom emoji or icon
4. **Descriptions**: Additional context information for each node
5. **Hugo Integration**: Seamlessly embedded within Hugo content using shortcodes
6. **Responsive Design**: Adapts to different screen sizes
7. **Interactive**: Click on nodes to see console output (check browser dev tools)

## Technical Implementation

The TreeView component is built using:

- **Svelte 5**: Modern component framework with runes
- **@keenmate/svelte-treeview**: High-performance tree component library
- **Vite**: Build tool for processing and bundling
- **Hugo Shortcodes**: Easy integration within Markdown content
- **Web Components**: Custom elements for cross-framework compatibility

The data is passed from Hugo's front matter through the shortcode to the Svelte component, demonstrating a clean integration between static site generation and dynamic UI components.