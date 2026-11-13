const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const root = path.resolve(__dirname, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const schema = read('schemas/ops/wechat_article.v1.json');
const registry = read('schemas/registry.json');
const valid = read('samples/valid.json');
const invalid = read('samples/invalid.json');

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
  if (!ok) failures += 1;
};
const errText = (v) => (v.errors || []).map((e) => `${e.instancePath || '/'} ${e.keyword}: ${e.message}`).join('; ');

const ajv = new Ajv2020({ allErrors: true, strict: false });

console.log('=== 0. Schema 元信息 ===');
console.log(`$schema = ${schema.$schema}`);
check('方言为 draft 2020-12', schema.$schema === 'https://json-schema.org/draft/2020-12/schema');
check('注册表登记了 ops.wechat_article v1', registry.schemas.some((s) => s.key === 'ops.wechat_article' && s.version === 'v1'));
check('注册表声明不得直接发布', registry.schemas.every((s) => s.direct_publish === false));

console.log('');
console.log('=== 1. 验收 4：Schema 通过 draft 2020-12 元模式校验 ===');
const metaOk = ajv.validateSchema(schema);
check('validateSchema(schema)', metaOk, metaOk ? '符合 2020-12 元模式' : errText(ajv));
const validate = ajv.compile(schema);

console.log('');
console.log('=== 2. 验收 3：5 份合法样例全部通过 ===');
check('合法样例数量为 5', valid.length === 5, `实际 ${valid.length}`);
valid.forEach((sample, i) => {
  const ok = validate(sample);
  check(`valid[${i + 1}] 通过`, ok, ok ? '' : errText(validate));
});

console.log('');
console.log('=== 3. 验收 3：5 份非法样例全部失败 ===');
check('非法样例数量为 5', invalid.length === 5, `实际 ${invalid.length}`);
invalid.forEach((item, i) => {
  const ok = validate(item.payload);
  check(`invalid[${i + 1}] 被拒绝 (${item.case})`, !ok, ok ? '意外通过' : errText(validate));
});

console.log('');
console.log('=== 4. 验收 1：titles 为 2 项或 4 项均校验失败 ===');
const base = valid[0];
check('titles=2 校验失败', !validate({ ...base, titles: base.titles.slice(0, 2) }));
check('titles=4 校验失败', !validate({ ...base, titles: [...base.titles, '额外标题占位'] }));

console.log('');
console.log('=== 5. 验收 2：link_placeholder 非 const 校验失败 ===');
const badLink = { ...base, signup_block: { ...base.signup_block, link_placeholder: 'https://example.invalid/signup' } };
check('link_placeholder 被改写时校验失败', !validate(badLink), errText(validate));

console.log('');
console.log('=== 6. 附加结构约束抽查 ===');
check('sections 少于 3 项被拒绝', !validate({ ...base, sections: base.sections.slice(0, 2) }));
check('section 内多余字段被拒绝', !validate({ ...base, sections: [{ ...base.sections[0], extra: 1 }, ...base.sections.slice(1)] }));
check('summary 超 120 字被拒绝', !validate({ ...base, summary: '字'.repeat(121) }));
check('顶层可选 lint_issues 允许系统写入', validate({ ...base, lint_issues: [{ code: 'REVIEW_PENDING', message: '等待复核' }] }));

console.log('');
console.log(`=== 汇总：${failures === 0 ? '全部通过' : failures + ' 项失败'} ===`);
process.exit(failures === 0 ? 0 : 1);
