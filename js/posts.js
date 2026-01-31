document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("post-title");
  const contentEl = document.getElementById("post-content");
  const metaEl = document.getElementById("post-meta");
  const authorEl = document.getElementById("post-author");
  const postTagEl = document.getElementById("post-tags");
  const sidebarTagEl = document.getElementById("sidebar-tags");
  const recentEl = document.getElementById("recent-posts");

  const params = new URLSearchParams(window.location.search);
  const postFile = params.get("post");

  if (!postFile) {
    contentEl.innerHTML = "<p>Post tidak ditemukan.</p>";
    return;
  }

  fetch(`blog/posts/${postFile}`)
    .then(res => res.text())
    .then(html => {
      contentEl.innerHTML = html;

      // Ambil meta dari HTML post
      const metaTitle = contentEl.querySelector('meta[name="title"]');
      const metaDate = contentEl.querySelector('meta[name="date"]');
      const metaTags = contentEl.querySelector('meta[name="tags"]');
      const metaAuthor = contentEl.querySelector('meta[name="author"]');

      const titleText = metaTitle ? metaTitle.content : "Untitled";
      const authorText = metaAuthor ? metaAuthor.content : "Rosyid Majid";
      titleEl.textContent = titleText;
      document.title = `Rosyid Majid - ${titleText}`;

// Fungsi render author + tanggal
function renderAuthorDate(author, dateStr) {
  const dateDisplay = dateStr ? `<span class="icon-calendar"></span> ${new Date(dateStr).toDateString()}` : document.getElementById("post-meta").innerHTML;
  metaEl.innerHTML = dateDisplay;
  authorEl.innerHTML = `<span class="icon-user"></span> ${author}`;
}

// Pakai meta date kalau ada, kalau tidak tetap default di HTML
if (metaDate) {
  renderAuthorDate(authorText, metaDate.content);
} else {
  // fallback ke posts.json
  fetch('blog/posts.json')
    .then(res => res.json())
    .then(posts => {
      const postData = posts.find(p => p.url === `single.html?post=${postFile}`);
      const postDate = postData && postData.date ? postData.date : null;
      renderAuthorDate(authorText, postDate);
    });
}


      // Tags post
      if (metaTags && postTagEl) {
        const tags = metaTags.content.split(",").map(t => t.trim());
        postTagEl.innerHTML = tags.map(tag => 
          `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="tag-cloud-link">#${tag}</a>`
        ).join(" ");
      }

      // Bungkus gambar dengan <p>
      contentEl.querySelectorAll("img").forEach(img => {
        if (!img.parentNode || img.parentNode.tagName.toLowerCase() !== "p") {
          const p = document.createElement("p");
          img.parentNode.insertBefore(p, img);
          p.appendChild(img);
        }
      });

      // Code highlight + wrapper
      contentEl.querySelectorAll("pre code").forEach(code => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("code-wrapper");
        code.parentNode.parentNode.replaceChild(wrapper, code.parentNode);
        wrapper.appendChild(code.parentNode);
      });

      // Prism highlight
      Prism.highlightAll();

      // Sidebar tag cloud
      if (sidebarTagEl) {
        fetch('blog/posts.json')
          .then(res => res.json())
          .then(posts => {
            let allTags = new Set();
            posts.forEach(p => { if (p.tags) p.tags.forEach(t => allTags.add(t)); });
            const tagArray = Array.from(allTags);
            sidebarTagEl.innerHTML = tagArray.length
              ? tagArray.map(tag => `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="tag-cloud-link">#${tag}</a>`).join(" ")
              : "<p>No tags</p>";
          });
      }

      // Recent posts
      if (recentEl) {
        fetch('blog/posts.json')
          .then(res => res.json())
          .then(posts => {
            const recentPosts = posts
              .filter(p => p.url !== `single.html?post=${postFile}`)
              .sort((a,b) => new Date(b.date) - new Date(a.date))
              .slice(0,3);
            recentEl.innerHTML = recentPosts.map(p => `
              <div class="block-21 mb-4 d-flex">
                <a class="blog-img mr-4" style="background-image: url('${p.image}')"></a>
                <div class="text">
                  <h3 class="heading"><a href="${p.url}">${p.title}</a></h3>
                  <div class="meta">
                    <div><span class="icon-calendar"></span> ${new Date(p.date).toDateString()}</div>
                  </div>
                </div>
              </div>
            `).join('');
          });
      }

      // Pindahkan meta dari <article> ke <head>
      const metas = contentEl.querySelectorAll('meta');
      metas.forEach(meta => {
        const name = meta.getAttribute('name');
        const content = meta.getAttribute('content');
        if (!name || !content) return;

        if (name === 'title') {
          document.title = content;
          return;
        }

        let headMeta = document.querySelector(`head meta[name="${name}"]`);
        if (!headMeta) {
          headMeta = document.createElement('meta');
          headMeta.setAttribute('name', name);
          document.head.appendChild(headMeta);
        }
        headMeta.setAttribute('content', content);
        meta.remove();
      });

    })
    .catch(err => {
      console.error("Gagal load post:", err);
      contentEl.innerHTML = "<p>Gagal memuat post.</p>";
    });
});
