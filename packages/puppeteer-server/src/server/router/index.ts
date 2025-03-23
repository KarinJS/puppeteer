import { router } from '../app'
import { hex } from './hex'
import { ping } from './ping'
import { render } from './render'
import { screenshot } from './screenshot'
import { upload, uploadHandler } from './upload'

router.get('/hex/:token', hex)
router.get('/ping', ping)

router.get('/render', render)
router.post('/render', render)
router.get('/screenshot', screenshot)
router.post('/screenshot', screenshot)
router.post('/upload', upload.single('file'), uploadHandler)
